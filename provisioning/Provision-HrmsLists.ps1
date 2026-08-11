<#
.SYNOPSIS
  Creates the 11 SharePoint lists (and their columns) the HRMS SPFx app expects,
  matching the data dictionary agreed for the project.

.USAGE
  Install-Module PnP.PowerShell -Scope CurrentUser   # if not already installed
  .\Provision-HrmsLists.ps1 -SiteUrl "https://7r4ptj.sharepoint.com/sites/HRMS"

  Uses the "HRMS Provisioning" Entra ID app (created via
  Register-PnPEntraIDAppForInteractiveLogin) for interactive sign-in.

  Safe to re-run: every list/field creation checks for an existing item first,
  so re-running after a partial failure just fills in what's missing.
#>

$ErrorActionPreference = "Stop"

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  Write-Host "PnP.PowerShell module not found. Installing for current user..." -ForegroundColor Yellow
  Install-Module PnP.PowerShell -Scope CurrentUser -Force -AllowClobber
}
Import-Module PnP.PowerShell

Write-Host "Connecting to $SiteUrl (a browser tab will open for sign-in)..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

$Group = "HRMS"

function Ensure-List {
  param(
    [string]$Title,
    [string]$Template = "GenericList"
  )
  $list = Get-PnPList -Identity $Title -ErrorAction SilentlyContinue
  if (-not $list) {
    Write-Host "Creating list: $Title" -ForegroundColor Green
    $list = New-PnPList -Title $Title -Template $Template -OnQuickLaunch:$false
  } else {
    Write-Host "List already exists: $Title" -ForegroundColor DarkGray
  }
  return $list
}

function Sync-ChoiceField {
  <#
    Ensure-Field only sets choices at creation time. This keeps an existing
    Choice field's option list up to date on every run (e.g. adding a new
    SystemRole later doesn't require touching already-provisioned tenants by hand).
  #>
  param(
    [string]$ListTitle,
    [string]$InternalName,
    [string[]]$Choices
  )
  $existing = Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction SilentlyContinue
  if (-not $existing) {
    return
  }
  $currentChoices = @($existing.Choices)
  $missing = $Choices | Where-Object { $currentChoices -notcontains $_ }
  if ($missing) {
    Write-Host "  Syncing choices on $ListTitle.$InternalName - adding: $($missing -join ', ')" -ForegroundColor Green
    Set-PnPField -List $ListTitle -Identity $InternalName -Values @{ Choices = $Choices }
  }
}

function Ensure-Field {
  param(
    [string]$ListTitle,
    [string]$InternalName,
    [string]$DisplayName,
    [string]$Type,
    [switch]$Required,
    [switch]$AddToDefaultView,
    [string[]]$Choices,
    [string]$DefaultValue,
    [string]$DateTimeFieldFormat
  )
  $existing = Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "  Field already exists: $ListTitle.$InternalName" -ForegroundColor DarkGray
    return
  }

  $requiredAttr = if ($Required) { "TRUE" } else { "FALSE" }
  $extraAttr = ""
  $innerXml = ""

  switch ($Type) {
    "URL" { $extraAttr = " Format='Hyperlink'" }
    "DateTime" {
      $fmt = if ($DateTimeFieldFormat -eq "DateOnly") { "DateOnly" } else { "DateTime" }
      $extraAttr = " Format='$fmt'"
    }
  }

  if ($Choices) {
    $choiceXml = ($Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ""
    $innerXml += "<CHOICES>$choiceXml</CHOICES>"
  }
  if ($DefaultValue) {
    $innerXml += "<Default>$DefaultValue</Default>"
  }

  $fieldXml = "<Field Type='$Type' DisplayName='$DisplayName' Name='$InternalName' Required='$requiredAttr' Group='$Group'$extraAttr>$innerXml</Field>"

  Write-Host "  Adding field: $ListTitle.$InternalName ($Type)" -ForegroundColor Green
  Add-PnPFieldFromXml -List $ListTitle -FieldXml $fieldXml | Out-Null
  # Note: -AddToDefaultView is accepted for readability but not applied - this module version
  # has no cmdlet to append a field to an existing view. Cosmetic only; add manually in the
  # SharePoint UI if you want these columns visible in "All Items". The app itself queries via
  # explicit $select, so this has no effect on functionality.
}

function Ensure-LookupField {
  param(
    [string]$ListTitle,
    [string]$InternalName,
    [string]$DisplayName,
    [string]$LookupListTitle,
    [switch]$Required,
    [switch]$AddToDefaultView
  )
  $existing = Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "  Lookup field already exists: $ListTitle.$InternalName" -ForegroundColor DarkGray
    return
  }

  $lookupList = Get-PnPList -Identity $LookupListTitle
  $requiredAttr = if ($Required) { "TRUE" } else { "FALSE" }
  $fieldXml = "<Field Type='Lookup' DisplayName='$DisplayName' Name='$InternalName' List='{$($lookupList.Id)}' ShowField='Title' Required='$requiredAttr' Group='$Group' />"

  Write-Host "  Adding lookup field: $ListTitle.$InternalName -> $LookupListTitle" -ForegroundColor Green
  $field = Add-PnPFieldFromXml -List $ListTitle -FieldXml $fieldXml
  # Note: -AddToDefaultView is accepted for readability but not applied - see Ensure-Field.
  return $field
}

# ---------------------------------------------------------------------------
# 1. Employees (created first: everything else looks up to it, incl. itself)
# ---------------------------------------------------------------------------
Ensure-List -Title "Employees" | Out-Null
Ensure-Field -ListTitle "Employees" -InternalName "EmployeeId" -DisplayName "Employee Id" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "Employees" -InternalName "Email" -DisplayName "Email" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "Employees" -InternalName "Designation" -DisplayName "Designation" -Type Text
Ensure-Field -ListTitle "Employees" -InternalName "Department" -DisplayName "Department" -Type Choice -Choices "HR", "Engineering", "Sales", "Finance", "Operations"
Ensure-Field -ListTitle "Employees" -InternalName "SystemRole" -DisplayName "System Role" -Type Choice -Choices "Employee", "Manager", "HR Admin", "Payroll Admin" -Required -DefaultValue "Employee" -AddToDefaultView
Ensure-Field -ListTitle "Employees" -InternalName "WorkLocation" -DisplayName "Work Location" -Type Choice -Choices "Office", "Remote", "WFH"
Ensure-Field -ListTitle "Employees" -InternalName "EmploymentStatus" -DisplayName "Employment Status" -Type Choice -Choices "Active", "Inactive", "On Leave" -Required -DefaultValue "Active"
Ensure-Field -ListTitle "Employees" -InternalName "DateOfBirth" -DisplayName "Date of Birth" -Type DateTime -DateTimeFieldFormat DateOnly
Ensure-Field -ListTitle "Employees" -InternalName "DateOfJoining" -DisplayName "Date of Joining" -Type DateTime -DateTimeFieldFormat DateOnly
Ensure-Field -ListTitle "Employees" -InternalName "ProfilePhoto" -DisplayName "Profile Photo" -Type URL
Ensure-LookupField -ListTitle "Employees" -InternalName "Manager" -DisplayName "Manager" -LookupListTitle "Employees"
Sync-ChoiceField -ListTitle "Employees" -InternalName "SystemRole" -Choices "Employee", "Manager", "HR Admin", "Payroll Admin"

# ---------------------------------------------------------------------------
# 2. Projects
# ---------------------------------------------------------------------------
Ensure-List -Title "Projects" | Out-Null
Ensure-Field -ListTitle "Projects" -InternalName "ProjectId" -DisplayName "Project Id" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "Projects" -InternalName "StartDate" -DisplayName "Start Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "Projects" -InternalName "EndDate" -DisplayName "End Date" -Type DateTime -DateTimeFieldFormat DateOnly
Ensure-Field -ListTitle "Projects" -InternalName "Status" -DisplayName "Status" -Type Choice -Choices "Not Started", "Working", "Completed", "Pending", "On Hold" -Required -DefaultValue "Not Started" -AddToDefaultView
Ensure-Field -ListTitle "Projects" -InternalName "Summary" -DisplayName "Summary" -Type Note
Ensure-LookupField -ListTitle "Projects" -InternalName "ProjectLead" -DisplayName "Project Lead" -LookupListTitle "Employees"

# ---------------------------------------------------------------------------
# 3. ProjectMembers (junction: Projects <-> Employees)
# ---------------------------------------------------------------------------
Ensure-List -Title "ProjectMembers" | Out-Null
Ensure-LookupField -ListTitle "ProjectMembers" -InternalName "Project" -DisplayName "Project" -LookupListTitle "Projects" -Required -AddToDefaultView
Ensure-LookupField -ListTitle "ProjectMembers" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-Field -ListTitle "ProjectMembers" -InternalName "RoleOnProject" -DisplayName "Role On Project" -Type Text
Ensure-Field -ListTitle "ProjectMembers" -InternalName "AssignedDate" -DisplayName "Assigned Date" -Type DateTime -DateTimeFieldFormat DateOnly

# ---------------------------------------------------------------------------
# 4. Timesheets
# ---------------------------------------------------------------------------
Ensure-List -Title "Timesheets" | Out-Null
Ensure-LookupField -ListTitle "Timesheets" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-LookupField -ListTitle "Timesheets" -InternalName "Project" -DisplayName "Project" -LookupListTitle "Projects" -Required -AddToDefaultView
Ensure-Field -ListTitle "Timesheets" -InternalName "Date" -DisplayName "Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "Timesheets" -InternalName "WorkLocation" -DisplayName "Work Location" -Type Choice -Choices "Office", "Remote", "WFH" -Required
Ensure-Field -ListTitle "Timesheets" -InternalName "HoursInvested" -DisplayName "Hours Invested" -Type Number -Required -AddToDefaultView
Ensure-Field -ListTitle "Timesheets" -InternalName "Description" -DisplayName "Description" -Type Note
Ensure-Field -ListTitle "Timesheets" -InternalName "Status" -DisplayName "Status" -Type Choice -Choices "Draft", "Submitted", "Approved", "Rejected" -Required -DefaultValue "Draft" -AddToDefaultView

# ---------------------------------------------------------------------------
# 5. LeaveRequests
# ---------------------------------------------------------------------------
Ensure-List -Title "LeaveRequests" | Out-Null
Ensure-LookupField -ListTitle "LeaveRequests" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-LookupField -ListTitle "LeaveRequests" -InternalName "Approver" -DisplayName "Approver" -LookupListTitle "Employees" -AddToDefaultView
Ensure-Field -ListTitle "LeaveRequests" -InternalName "LeaveType" -DisplayName "Leave Type" -Type Choice -Choices "Sick", "Annual", "WFH", "Unpaid", "Maternity", "Paternity" -Required -AddToDefaultView
Ensure-Field -ListTitle "LeaveRequests" -InternalName "FromDate" -DisplayName "From Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "LeaveRequests" -InternalName "ToDate" -DisplayName "To Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "LeaveRequests" -InternalName "Reason" -DisplayName "Reason" -Type Note
Ensure-Field -ListTitle "LeaveRequests" -InternalName "Status" -DisplayName "Status" -Type Choice -Choices "Pending", "Approved", "Rejected", "Cancelled" -Required -DefaultValue "Pending" -AddToDefaultView
Ensure-Field -ListTitle "LeaveRequests" -InternalName "AppliedOn" -DisplayName "Applied On" -Type DateTime -DateTimeFieldFormat DateTime -Required -DefaultValue "[today]"
Ensure-Field -ListTitle "LeaveRequests" -InternalName "ApproverComments" -DisplayName "Approver Comments" -Type Note

# ---------------------------------------------------------------------------
# 6. LeaveBalances
# ---------------------------------------------------------------------------
Ensure-List -Title "LeaveBalances" | Out-Null
Ensure-LookupField -ListTitle "LeaveBalances" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-Field -ListTitle "LeaveBalances" -InternalName "Year" -DisplayName "Year" -Type Number -Required -AddToDefaultView
Ensure-Field -ListTitle "LeaveBalances" -InternalName "AnnualEntitlement" -DisplayName "Annual Entitlement" -Type Number -Required -DefaultValue "24"
Ensure-Field -ListTitle "LeaveBalances" -InternalName "LeaveTaken" -DisplayName "Leave Taken" -Type Number -Required -DefaultValue "0"
Ensure-Field -ListTitle "LeaveBalances" -InternalName "SickLeaveEntitlement" -DisplayName "Sick Leave Entitlement" -Type Number -DefaultValue "5"
Ensure-Field -ListTitle "LeaveBalances" -InternalName "SickLeaveTaken" -DisplayName "Sick Leave Taken" -Type Number -DefaultValue "0"

# ---------------------------------------------------------------------------
# 7. Attendance
# ---------------------------------------------------------------------------
Ensure-List -Title "Attendance" | Out-Null
Ensure-LookupField -ListTitle "Attendance" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-Field -ListTitle "Attendance" -InternalName "Date" -DisplayName "Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "Attendance" -InternalName "ClockIn" -DisplayName "Clock In" -Type DateTime -DateTimeFieldFormat DateTime
Ensure-Field -ListTitle "Attendance" -InternalName "ClockOut" -DisplayName "Clock Out" -Type DateTime -DateTimeFieldFormat DateTime
Ensure-Field -ListTitle "Attendance" -InternalName "Status" -DisplayName "Status" -Type Choice -Choices "Present", "Absent", "WFH", "Half Day", "Holiday", "Off" -Required -DefaultValue "Present" -AddToDefaultView

# ---------------------------------------------------------------------------
# 8. Payroll
# ---------------------------------------------------------------------------
Ensure-List -Title "Payroll" | Out-Null
Ensure-LookupField -ListTitle "Payroll" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-Field -ListTitle "Payroll" -InternalName "PayPeriod" -DisplayName "Pay Period" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "Payroll" -InternalName "BasicSalary" -DisplayName "Basic Salary" -Type Currency -Required
Ensure-Field -ListTitle "Payroll" -InternalName "Allowances" -DisplayName "Allowances" -Type Currency -DefaultValue "0"
Ensure-Field -ListTitle "Payroll" -InternalName "Deductions" -DisplayName "Deductions" -Type Currency -DefaultValue "0"
Ensure-Field -ListTitle "Payroll" -InternalName "NetPay" -DisplayName "Net Pay" -Type Currency -Required -AddToDefaultView
Ensure-Field -ListTitle "Payroll" -InternalName "PayslipUrl" -DisplayName "Payslip" -Type URL
Ensure-Field -ListTitle "Payroll" -InternalName "PaymentStatus" -DisplayName "Payment Status" -Type Choice -Choices "Pending", "Paid" -DefaultValue "Pending" -AddToDefaultView

# ---------------------------------------------------------------------------
# 9. ToDoTasks
# ---------------------------------------------------------------------------
Ensure-List -Title "ToDoTasks" | Out-Null
Ensure-LookupField -ListTitle "ToDoTasks" -InternalName "Employee" -DisplayName "Employee" -LookupListTitle "Employees" -Required -AddToDefaultView
Ensure-Field -ListTitle "ToDoTasks" -InternalName "TaskText" -DisplayName "Task" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "ToDoTasks" -InternalName "IsCompleted" -DisplayName "Is Completed" -Type Boolean -Required -DefaultValue "0"
Ensure-Field -ListTitle "ToDoTasks" -InternalName "CreatedOn" -DisplayName "Created On" -Type DateTime -DateTimeFieldFormat DateTime -Required -DefaultValue "[today]"

# ---------------------------------------------------------------------------
# 10. Holidays (reference list, no employee lookup)
# ---------------------------------------------------------------------------
Ensure-List -Title "Holidays" | Out-Null
Ensure-Field -ListTitle "Holidays" -InternalName "HolidayName" -DisplayName "Holiday Name" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "Holidays" -InternalName "Date" -DisplayName "Date" -Type DateTime -DateTimeFieldFormat DateOnly -Required -AddToDefaultView
Ensure-Field -ListTitle "Holidays" -InternalName "Type" -DisplayName "Type" -Type Choice -Choices "Public", "Optional", "Restricted" -Required -DefaultValue "Public"

# ---------------------------------------------------------------------------
# 11. HRPolicies (document library, no employee lookup)
# ---------------------------------------------------------------------------
Ensure-List -Title "HRPolicies" -Template "DocumentLibrary" | Out-Null
Ensure-Field -ListTitle "HRPolicies" -InternalName "PolicyName" -DisplayName "Policy Name" -Type Text -Required -AddToDefaultView
Ensure-Field -ListTitle "HRPolicies" -InternalName "Category" -DisplayName "Category" -Type Choice -Choices "Leave Policy", "Code of Conduct", "IT Policy", "Payroll Policy" -AddToDefaultView
Ensure-Field -ListTitle "HRPolicies" -InternalName "EffectiveDate" -DisplayName "Effective Date" -Type DateTime -DateTimeFieldFormat DateOnly -AddToDefaultView
Ensure-Field -ListTitle "HRPolicies" -InternalName "Versions" -DisplayName "Version" -Type Text
Ensure-Field -ListTitle "HRPolicies" -InternalName "DocumentUrl" -DisplayName "Document Url" -Type URL -AddToDefaultView

Write-Host ""
Write-Host "Done. All 11 lists are provisioned (or already existed) at $SiteUrl." -ForegroundColor Cyan
Write-Host "Next: add yourself as a row in Employees so EmployeeService.getCurrentEmployee() resolves." -ForegroundColor Cyan

Disconnect-PnPOnline
