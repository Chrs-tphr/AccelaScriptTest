/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2021
|
| Program : InspectionCancelAfter_20_1_2.js
| Event   : InspectionCancelAfter
|
| Usage   :  Used to run events when an inspection is cancelled.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : Original version J. Ramirez
|           Modified for 3.0 architecture by J. Chalk 4/27/2021
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section should be changed.
/------------------------------------------------------------------------------------------------------*/
var controlString = "InspectionCancelAfter"; // Standard choice for control
var preExecute = "PreExecuteForAfterEvents"; // Standard choice to execute first (for globals, etc)
var documentOnly = false; // Document Only -- displays hierarchy of std choice steps
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 20;
var useCustomScriptFile = true; // if true, use Events->Custom Script and Master Scripts, else use Events->Scripts->INCLUDES_*
var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
    useSA = true;
    SA = bzr.getOutput().getDescription();
    bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
    if (bzr.getSuccess()) {
        SAScript = bzr.getOutput().getDescription();
    }
}
var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";
var doStdChoices = true; // compatibility default
var doScripts = false;
var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0;
if (bzr) {
    var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE");
    doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
    var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT");
    doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
    var bvr3 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "USE_MASTER_INCLUDES");
    if (bvr3.getSuccess()) {
        if (bvr3.getOutput().getDescription() == "No")
            useCustomScriptFile = false;
    }
}
if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA, useCustomScriptFile));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA, useCustomScriptFile));
    eval(getScriptText(SAScript, SA));
} else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useCustomScriptFile));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, useCustomScriptFile));
}
eval(getScriptText("INCLUDES_CUSTOM", null, useCustomScriptFile));
if (documentOnly) {
    doStandardChoiceActions(controlString, false, 0);
    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
    aa.abortScript();
}
var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName);
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)
        servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}
/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
//Get inspection model list
var inspectionList = aa.env.getValue("InspectionList");
//Get product
var product = aa.env.getValue("Product");
logDebug("Product: " + product);
var inspIdArr = inspectionList.toArray();
var inspectionModel;
var capId = null;
var inspGroup;
var inspType;
var appTypeString;
var appTypeArray;
var requiredInspection = false;
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
if (preExecute.length)
    doStandardChoiceActions(preExecute, true, 0); // run Pre-execution code
logGlobals(AInfo);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
for (inspCount in inspIdArr) {
    inspectionModel = inspIdArr[inspCount];
    inspSeqNum = inspIdArr[inspCount].getInspSequenceNumber();
    inspNum = inspIdArr[inspCount].getIdNumber();
    capId = inspectionModel.getCapID();
    recordNum = capId.getCustomID();
    inspGroup = inspectionModel.getInspectionGroup();
    inspType = inspectionModel.getInspectionType();
    capTypeModelResult = aa.cap.getCapTypeModelByCapID(capId);
    capTypeModel = capTypeModelResult.getOutput();
    appTypeString = capTypeModel.toString();
    appTypeArray = capTypeModel.toString().split("/");
    if (inspectionModel.getActivity().getRequiredInspection() == "Y") {
        requiredInspection = true;
    } else {
        requiredInspection = false;
    }
    primaryAddr = inspIdArr[inspCount].getPrimaryAddress();
    inspectorObj = inspIdArr[inspCount].getInspector();
    inspReqDate = inspIdArr[inspCount].getRequestDate();
    schedDate = inspIdArr[inspCount].getScheduledDate();
    schedDateStr = inspIdArr[inspCount].getScheduledDateString();
    logDebug("inspectionModel = " + inspectionModel.getClass());
    logDebug("inspType = " + inspType);
    logDebug("capId = " + capId);
    logDebug("recordNum = " + recordNum);
    logDebug("inspSeqNum =  " + inspSeqNum);
    logDebug("inspNum = " + inspNum);
    logDebug("inspGroup = " + inspGroup);
    logDebug("inspectorObj = " + inspectorObj);
    logDebug("appTypeString = " + appTypeString);
    logDebug("requiredInspection = " + requiredInspection);
    logDebug("primaryAddr = " + primaryAddr);
    logDebug("inspReqDate = " + inspReqDate);
    logDebug("schedDate = " + schedDate);
    logDebug("schedDateStr = " + schedDateStr);
    if (doStdChoices)
        doStandardChoiceActions(controlString, true, 0);
    //  Next, execute and scripts that are associated to the record type
    if (doScripts)
        doScriptActions();
    // this controller replaces lookups for STANDARD_SOLUTIONS and CONFIGURABLE_RULESETS
    doConfigurableScriptActions();
}
// Check for invoicing of fees
//
if (feeSeqList.length) {
    invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
} else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage)
        aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug)
        aa.env.setValue("ScriptReturnMessage", debug);
}
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/