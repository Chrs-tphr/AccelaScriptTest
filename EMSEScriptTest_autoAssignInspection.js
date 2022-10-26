//@ts-check
var myCapId = "2022-BDCN-07131";
var myUserId = "admin";
var showDebug = 1;
var debug = "";

/* ASA  */  //var eventName = "ApplicationSubmitAfter";
/* WTUA */  var eventName = "WorkflowTaskUpdateAfter";  var wfTask = "Economic Development Review";	  var wfStatus = "Pending Under Review";  var wfDateMMDDYYYY = "01/27/2022";
/* IRSA */  //var eventName = "InspectionResultSubmitAfter" ; var inspResult = "Void"; var inspResultComment = "Comment";  var inspType = "Utility Inspection"
/* ISA  */  //var eventName = "InspectionScheduleAfter" ; var inspType = "Roofing";
/* PRA  */  //var eventName = "PaymentReceiveAfter";

var useProductInclude = true; //  set to true to use the "productized" include file (events->custom script), false to use scripts from (events->scripts)
var useProductScript = true;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.

/* master script code don't touch */ aa.env.setValue("EventName", eventName); var vEventName = eventName; var controlString = eventName; var tmpID = aa.cap.getCapID(myCapId).getOutput(); if (tmpID != null) { aa.env.setValue("PermitId1", tmpID.getID1()); aa.env.setValue("PermitId2", tmpID.getID2()); aa.env.setValue("PermitId3", tmpID.getID3()); } aa.env.setValue("CurrentUserID", myUserId); var preExecute = "PreExecuteForAfterEvents"; var documentOnly = false; var SCRIPT_VERSION = 3.0; var useSA = false; var SA = null; var SAScript = null; var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { useSA = true; SA = bzr.getOutput().getDescription(); bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT"); if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); } } if (SA) { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA, useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript, SA, useProductScript)); } else { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, useProductScript)); } eval(getScriptText("INCLUDES_CUSTOM", null, useProductInclude)); if (documentOnly) { doStandardChoiceActions2(controlString, false, 0); aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed."); aa.abortScript(); } var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName); var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS"; var doStdChoices = true; var doScripts = false; var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0; if (bzr) { var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE"); doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT"); doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; } function getScriptText(vScriptName, servProvCode, useProductScripts) { if (!servProvCode) servProvCode = aa.getServiceProviderCode(); vScriptName = vScriptName.toUpperCase(); var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); try { if (useProductScripts) { var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName); } else { var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN"); } return emseScript.getScriptText() + ""; } catch (err) { return ""; } } logGlobals(AInfo); if (runEvent && typeof (doStandardChoiceActions) == "function" && doStdChoices) try { doStandardChoiceActions(controlString, true, 0); } catch (err) { logDebug(err.message) } if (runEvent && typeof (doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g, "\r"); aa.print(z);

try {
    logDebug("-----------------------------------------SCRIPT TEST--------------------------------------------");

    logDebug("capId: "+capId);
    var thisInsp = aa.inspection.getInspectionType("PERBCRNA", "Final").getOutput();
    if(thisInsp){
        var iSeqNum = thisInsp[0].getSequenceNumber();
        logDebug("iSeqNum: "+iSeqNum);
        autoScheduleInspection(capId, iSeqNum, nextWorkDay(dateAdd(null,29)));
    }else{logDebug("ERROR: Did not find Final Inspection")}

    //start supporting functions
    function autoScheduleInspection(vCapId, inspSeqNbr, date) {
        var funcName = "autoScheduleInspection(): ";
        logDebug("***STARTING function: " + funcName + new Date().toLocaleTimeString());
        var inspModel;
        var inspScriptModel;
        var inspScriptModelResult = aa.inspection.getInspection(vCapId, inspSeqNbr);
        if (inspScriptModelResult.getSuccess()) {
            inspScriptModel = inspScriptModelResult.getOutput();
            inspModel = inspScriptModel.getInspection();
        } else {
            logDebug(funcName + "**ERROR: Could not get inspection from record. InspSeqNbr: " + inspSeqNbr + ". " + inspScriptModelResult.getErrorMessage());
        }
        // work around required to set autoAssign = Y on new inspection (defaults to "N" when scheduled via script)
        var actModel = inspModel.getActivity();
        actModel.setAutoAssign("Y");
        inspModel.setActivity(actModel);
        logDebug(funcName + "Schedule on earliest date: " + date);
        inspModel.getActivity().setActivityDate(date);
        inspSchedDate = aa.util.formatDate(date, "MM/dd/yyyy");
        var assignSwitch = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.model.AssignSwitch").getOutput();
        assignSwitch.setGetNextAvailableTime(true);
        assignSwitch.setOnlyAssignOnGivenDate(false);
        assignSwitch.setValidateCutOffTime(false);
        assignSwitch.setValidateScheduleNumOfDays(false);
        assignSwitch.setAutoAssignOnGivenDeptAndUser(false);
        assignSwitch.setCheckingCalendar(true);
        var assignService = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.AssignInspectionBusiness").getOutput();
        var inspectionList = aa.util.newArrayList();
        inspectionList.add(inspModel);
        var specifiedDate = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.model.SpecifiedDateTime").getOutput();
        specifiedDate.setDate(date)
        var result = assignService.autoAssign4AddOns(aa.getServiceProviderCode(), inspectionList, specifiedDate, assignSwitch);
        var assinfo = null;
        // last change made
        if (result.size() <= 0) {
            return false;
        }
        var atm = result.get(0);
        assinfo = atm;
        var errMsg = "";
        if (assinfo.flag == "S") {
            logDebug(funcName + "Successfully auto scheduled inspection.");
            var inspector = assinfo.getInspector();
            var schedDate = assinfo.getScheduleDate();
            var schedDateScript = aa.date.getScriptDateTime(schedDate);
            inspScriptModel.setInspector(inspector);
            inspScriptModel.setScheduledDate(schedDateScript);
            var editInspResult = aa.inspection.editInspection(inspScriptModel)
            if (!editInspResult.getSuccess()) {
                logDebug(funcName + "WARNING: re-assigning inspection " + editInspResult.getErrorMessage());
                return false;
            } else {
                logDebug(funcName + "Successfully reassigned inspection " + inspScriptModel.getInspectionType() + " to user " + inspector.getUserID() + " on " + schedDate);
            }
            return true;
        }
        if (assinfo.flag == "C") {
            logDebug(funcName + "WARNING: Cut off will not allow to schedule.");
        }
        if (assinfo.flag == "U") {
            logDebug(funcName + "WARNING: Unable to auto schedule and assign inspection.");
            switch (assinfo.resultType) {
                case 24:
                    errMsg = "Auto assign is disabled for inspection.";
                    break;
                case 25:
                    errMsg = "Calendar not found.";
                    break;
                case 23:
                    errMsg = "Inspector not found.";
                    break;
                case 22:
                    errMsg = "End time is less than start time.";
                    break;
                case 21:
                    errMsg = "End time not available.";
                    break;
                case 9:
                    errMsg = "Inspection unit exceeded inspector max unit.";
                case 2:
                    errMsg = "Next available time not found.";
                    break;
                default:
                    errMsg = "Cannot schedule.";
                    break;
            }
            logDebug(errMsg);
        }
        if (assinfo.flag == "F") {
            logDebug(funcName + "WARNING: Can not auto schedule and assign inspection. Calendar is full.");
            switch (assinfo.resultType) {
                case 4:
                    errMsg = "Calendar Units full.";
                    break;
                case 6:
                    errMsg = "Calendar Inspection overlap.";
                    break;
                case 10:
                    errMsg = "Inspection Units Full";
                    break;
                case 11:
                    errMsg = "Inspection Inspection Overlap";
                    break;
                case 5:
                    errMsg = "Next inspection not found.";
                    break;
                case 12:
                    errMsg = "Issue with number of schedule days.";
                case 13:
                    errMsg = "Not a working day";
                case 14:
                    errMsg = "Scheduled time is not avaialble";
                    break;
                case 15:
                    errMsg = "Calendar daily units are full";
                    break;
                case 16:
                    errMsg = "Calendar event units are full.";
                    break;
                default:
                    errMsg = "";
                    break;
            }
            logDebug(errMsg);
        }
        logDebug("***ENDING function: " + funcName + new Date().toLocaleTimeString() + "<br>");
        return assinfo;
    }

    //end supporting functions

}
catch (err) {
	logDebug("A JavaScript Error occurred: " + err.message + " at line " + err.lineNumber + " stack: " + err.stack);
}
// end user code
aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", debug);

function exploreObject(objExplore) {
    var functionArray = [];
    var propertiesArray = [];
    logDebug("Methods:");
    for (var x in objExplore) {
        try {
            if (typeof (objExplore[x]) === "function") {
                functionArray.push("<font color=blue><u><b>" + x + "</b></u></font> "+"   " + objExplore[x])
                // logDebug("<font color=blue><u><b>" + x + "</b></u></font> ");
                // logDebug("   " + objExplore[x] + "<br>");
            }
        } catch (err) {
            logDebug("exploreObject(): **ERROR** in Functions: " + err.Message);
        }
        var counter = objExplore.length;
    }
    functionArray.sort();
    for(fa in functionArray) logDebug(functionArray[fa]+"<br>");

    logDebug("");
    logDebug("Properties:");
    for (var y in objExplore) {
        try {
            if (typeof (objExplore[y]) !== "function") {
                propertiesArray.push("  <b> " + y + ": </b> " + objExplore[y])
                // logDebug("  <b> " + y + ": </b> " + objExplore[y]);
            }
        } catch (err) {
            logDebug("exploreObject(): **ERROR** in Properties: " + err.Message);
        }
    }
    propertiesArray.sort();
    for(pa in propertiesArray) logDebug(propertiesArray[pa]+"<br>");
}