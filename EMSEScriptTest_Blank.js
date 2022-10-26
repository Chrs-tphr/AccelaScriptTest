//@ts-check
var myCapId = "2022-UTIL-08331";
var myUserId = "admin";
var showDebug = 1;
var debug = "";

/* ASA  */  //var eventName = "ApplicationSubmitAfter";
/* WTUA */  //var eventName = "WorkflowTaskUpdateAfter";  var wfTask = "Traffic Engineering Review";	  var wfStatus = "Rejected";  var wfDateMMDDYYYY = "01/27/2022";
/* IRSA */  //var eventName = "InspectionResultSubmitAfter" ; var inspResult = "Void"; var inspResultComment = "Comment";  var inspType = "Utility Inspection"
/* ICA */  var eventName = "InspectionCancelAfter" ; var inspResult = "Cancelled"; var inspResultComment = "Comment";  var inspType = "Utility Inspection"
/* ISA  */  //var eventName = "InspectionScheduleAfter" ; var inspType = "Roofing";
/* PRA  */  //var eventName = "PaymentReceiveAfter";

var useProductInclude = true; //  set to true to use the "productized" include file (events->custom script), false to use scripts from (events->scripts)
var useProductScript = true;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.

/* master script code don't touch */ aa.env.setValue("EventName", eventName); var vEventName = eventName; var controlString = eventName; var tmpID = aa.cap.getCapID(myCapId).getOutput(); if (tmpID != null) { aa.env.setValue("PermitId1", tmpID.getID1()); aa.env.setValue("PermitId2", tmpID.getID2()); aa.env.setValue("PermitId3", tmpID.getID3()); } aa.env.setValue("CurrentUserID", myUserId); var preExecute = "PreExecuteForAfterEvents"; var documentOnly = false; var SCRIPT_VERSION = 3.0; var useSA = false; var SA = null; var SAScript = null; var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { useSA = true; SA = bzr.getOutput().getDescription(); bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT"); if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); } } if (SA) { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA, useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript, SA, useProductScript)); } else { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, useProductScript)); } eval(getScriptText("INCLUDES_CUSTOM", null, useProductInclude)); if (documentOnly) { doStandardChoiceActions2(controlString, false, 0); aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed."); aa.abortScript(); } var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName); var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS"; var doStdChoices = true; var doScripts = false; var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0; if (bzr) { var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE"); doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT"); doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; } function getScriptText(vScriptName, servProvCode, useProductScripts) { if (!servProvCode) servProvCode = aa.getServiceProviderCode(); vScriptName = vScriptName.toUpperCase(); var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); try { if (useProductScripts) { var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName); } else { var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN"); } return emseScript.getScriptText() + ""; } catch (err) { return ""; } } logGlobals(AInfo); if (runEvent && typeof (doStandardChoiceActions) == "function" && doStdChoices) try { doStandardChoiceActions(controlString, true, 0); } catch (err) { logDebug(err.message) } if (runEvent && typeof (doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g, "\r"); aa.print(z);

try {
    
    //get current date and hour
    var now = new Date(); logDebug("now: "+now);
    var cDate = now.getMonth() + "/" + now.getDate() + "/" + now.getFullYear(); logDebug("cDate: "+cDate);
    var cdm = new Date(cDate);
    var cHour = now.getHours(); logDebug("cHour: "+cHour);
    var insResult = aa.inspection.getInspections(capId);
    if(insResult.getSuccess()){
        var insObjArr = insResult.getOutput();
        for(ii in insObjArr){
            var tIns = insObjArr[ii];
            var tInsCustomId = tIns.getCapID().getCustomID(); logDebug("tInsCustomId: "+tInsCustomId);
            //get cancelled inspection
            if(matches(tIns.getIdNumber(),inspNum) && matches(tIns.getInspectionStatus(),"Cancelled")){//should do something with Rescheduled inspections
                //get inspection info
                var insType = tIns.getInspectionType(); logDebug("insType: "+insType);

                //get scheduled date
                var iSD = new Date(dateAdd(tIns.getScheduledDate(),0)); logDebug("iSD: "+iSD);
                var inspSchDate = iSD.getMonth() + "/" + iSD.getDate() + "/" + iSD.getFullYear(); logDebug("inspSchDate: "+inspSchDate);
                var insSchDate = (iSD.getMonth()+1) + "/" + iSD.getDate() + "/" + iSD.getFullYear(); logDebug("insSchDate: "+insSchDate);//for email
                var sdm = new Date(inspSchDate);
                logDebug("sdm: "+sdm+" cdm: "+cdm);
                if((sdm <= cdm) && (cHour >= 0 && cHour <= 16)){
                    //get inspector email
                    var insInspector = tIns.getInspector(); logDebug("insInspector: "+insInspector);
                    if(!matches(insInspector,null,"")){
                        var inspUserObj = aa.person.getUser(insInspector.getFirstName(),insInspector.getMiddleName(),insInspector.getLastName()).getOutput();
                        var inspectorEmail = inspUserObj.getEmail(); logDebug("inspectorEmail: "+inspectorEmail);
                        if(!matches(inspectorEmail,"",null)){
                            //email params
                            var emailParams = aa.util.newHashtable();
                            addParameter(emailParams, "$$altID$$", recordNum);
                            addParameter(emailParams, "$$recordAddress$$", primaryAddr);
                            addParameter(emailParams, "$$insType$$", inspType);
                            addParameter(emailParams, "$$insSchedDate$$", insSchDate);
                            //send inspector email
                            logDebug("SENDING EMAIL TO INSPECTOR");
                            sendNotification("noreply@accela.com",inspectorEmail,"","notificationTemplate",emailParams,null);
                        }else{
                            logDebug("Inspector does not have email")
                        }
                    }else{
                        logDebug("Inspection not assigned")
                    }
                }else{
                    logDebug("Cancelled inspection does not meet criteria to email inspector");
                }
                //email applicant
                sendNotification("noreply@accela.com",staffEmail,"","PERMITS_INSPECTION_CANCELLED",emailParams,null);
            }else{
                logDebug("Inspection not Cancelled")
            }
        }
    }else{
        logDebug("Could not get inspections")
    }

    //supporting functions
    function getPrimaryAddress(pCapId){	
        var addr;
        var addrLine1 = "";
        var priAddrExists = false;	
        var capAddressResult = aa.address.getAddressByCapId(pCapId);
        if (capAddressResult.getSuccess()){
            Address = capAddressResult.getOutput();
            for(yy in Address){
                if("Y"==Address[yy].getPrimaryFlag()){
                    priAddrExists = true;				
                    logDebug("Target CAP has primary address");
                    addr = Address[yy];
                    addrLine1 = addr.getAddressLine1();
                    if(addrLine1 == null){
                        addrLine1 = addr.getHouseNumberStart();
                        addrLine1 += (addr.getStreetDirection() != null? " " + addr.getStreetDirection(): "");
                        addrLine1 += (addr.getStreetName() != null? " " + addr.getStreetName(): "");
                        addrLine1 += (addr.getStreetSuffix() != null? " " + addr.getStreetSuffix(): "");
                        addrLine1 += (addr.getUnitType() != null? " " + addr.getUnitType(): "");
                        addrLine1 += (addr.getUnitStart() != null? " " + addr.getUnitStart(): "");
                        addrLine1 += (addr.getCity() != null? " " + addr.getCity(): "");
                        addrLine1 += (addr.getState() != null? " " + addr.getState(): "");
                        addrLine1 += (addr.getZip() != null? " " + addr.getZip(): "");			
                        break;
                    }
                }
            }
        }else{
            logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
        }
        return addrLine1;
    }



    function getAssignedToEmailFromWfTask(wfTaskDescription){
        var userEmail = null;
        var taskResult = aa.workflow.getTask(capId, wfTaskDescription);
        var wfTaskO = taskResult.getOutput();
        if (wfTaskO){
            var wfUserObj = aa.person.getUser(wfTaskO.getAssignedStaff().getFirstName(), wfTaskO.getAssignedStaff().getMiddleName(), wfTaskO.getAssignedStaff().getLastName()).getOutput();
            userEmail = wfUserObj.getEmail();
            logDebug("userEmail: "+userEmail);
        }
        return userEmail;
    }
        



    //get assigned staff email

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