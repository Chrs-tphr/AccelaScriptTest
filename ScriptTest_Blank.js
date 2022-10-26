//@ts-check
var myCapId = "";
var myUserId = "admin";
var showDebug = 1;
var debug = "";

/* ASA  */  //var eventName = "ApplicationSubmitAfter";
/* WTUA */  //var eventName = "WorkflowTaskUpdateAfter";  var wfTask = "Traffic Engineering Review";	  var wfStatus = "Rejected";  var wfDateMMDDYYYY = "06/22/2022";
/* IRSA */  //var eventName = "InspectionResultSubmitAfter" ; var inspResult = "Void"; var inspResultComment = "Comment";  var inspType = "Utility Inspection"
/* ICA */  //var eventName = "InspectionCancelAfter" ; var inspResult = "Cancelled"; var inspResultComment = "Comment";  var inspType = "Utility Inspection"
/* ISA  */  //var eventName = "InspectionScheduleAfter" ; var inspType = "Roofing";
/* PRA  */  //var eventName = "PaymentReceiveAfter";
/* PPB  */  var eventName = "PaymentProcessingBefore";

var useProductInclude = true; //  set to true to use the "productized" include file (events->custom script), false to use scripts from (events->scripts)
var useProductScript = true;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.

/* master script code don't touch */ 
aa.env.setValue("EventName", eventName); var vEventName = eventName; var controlString = eventName; var tmpID = aa.cap.getCapID(myCapId).getOutput(); if (tmpID != null) { aa.env.setValue("PermitId1", tmpID.getID1()); aa.env.setValue("PermitId2", tmpID.getID2()); aa.env.setValue("PermitId3", tmpID.getID3()); } aa.env.setValue("CurrentUserID", myUserId); var preExecute = "PreExecuteForAfterEvents"; var documentOnly = false; var SCRIPT_VERSION = 3.0; var useSA = false; var SA = null; var SAScript = null; var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { useSA = true; SA = bzr.getOutput().getDescription(); bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT"); if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); } } if (SA) { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA, useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript, SA, useProductScript)); } else { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useProductScript)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, useProductScript)); } eval(getScriptText("INCLUDES_CUSTOM", null, useProductInclude)); if (documentOnly) { doStandardChoiceActions2(controlString, false, 0); aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed."); aa.abortScript(); } var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName); var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS"; var doStdChoices = true; var doScripts = false; var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0; if (bzr) { var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE"); doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT"); doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; } function getScriptText(vScriptName, servProvCode, useProductScripts) { if (!servProvCode) servProvCode = aa.getServiceProviderCode(); vScriptName = vScriptName.toUpperCase(); var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); try { if (useProductScripts) { var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName); } else { var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN"); } return emseScript.getScriptText() + ""; } catch (err) { return ""; } } logGlobals(AInfo); if (runEvent && typeof (doStandardChoiceActions) == "function" && doStdChoices) try { doStandardChoiceActions(controlString, true, 0); } catch (err) { logDebug(err.message) } if (runEvent && typeof (doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g, "\r"); aa.print(z);

try {

    for(i in paymentModels){
        var thisPaymentModel = paymentModels[i];
        var paymentMethod = thisPaymentModel.getPaymentMethod();
        var CheckNbr = thisPaymentModel.getCheckNbr();
        if(matches(paymentMethod, "Business Check", "Personal Check", "Cashiers Check", "Travelers Check", "Money Order")){
            logDebug("Payment is Check or Money Order");
            if(matches(CheckNbr, null, "")){
                logDebug("Check Number is required and was not provided");
                cancel = true;
                showMessage = true;
                comment("Check Number is Required");
            }else{
                logDebug("Check Number was provided");
            }
        }else{
            logDebug("Payment is not Check or Money Order");
        }
    }
    
    if(matches(paymentRefNbr, null, "")) cancel;

    var ppPaymentMethods = new Array();

if (paymentModels != null && paymentModels != "") {
	for (var i = 0; i < paymentModels.length; i++) {
		ppPaymentMethods[i] = new Array();
		var paymentModel = paymentModels[i];
		var paymentMethod = paymentModel.getPaymentMethod();
		if (paymentMethod == 'Trust Account') {
			ppPaymentMethods[i].trustAccount = paymentModel.getAcctID();
			logDebug("**(String)ppPaymentMethods[" + i + "].trustAccount:" + ppPaymentMethods[i].trustAccount);
		}
		ppPaymentMethods[i].paymentMethod = paymentMethod;
		ppPaymentMethods[i].paymentRefNbr = paymentModel.getPaymentRefNbr();
		ppPaymentMethods[i].payee = paymentModel.getPayee();
		ppPaymentMethods[i].paymentComment = paymentModel.getPaymentComment();
		ppPaymentMethods[i].receivedType = paymentModel.getReceivedType();
		ppPaymentMethods[i].paymentAmount = paymentModel.getPaymentAmount();
		ppPaymentMethods[i].cardHolderName = paymentModel.getCardHolderName();
		ppPaymentMethods[i].ccAuthCode = paymentModel.getCCAuthCode();
		ppPaymentMethods[i].module = paymentModel.getModule();

		logDebug("**(string)ppPaymentMethods[" + i + "].paymentMethod:" + ppPaymentMethods[i].paymentMethod);
		logDebug("**(string)ppPaymentMethods[" + i + "].paymentRefNbr:" + ppPaymentMethods[i].paymentRefNbr);
		logDebug("**(string)ppPaymentMethods[" + i + "].payee:" + ppPaymentMethods[i].payee);
		logDebug("**(string)ppPaymentMethods[" + i + "].paymentComment:" + paymentModel.getPaymentComment());
		logDebug("**(string)ppPaymentMethods[" + i + "].receivedType:" + ppPaymentMethods[i].receivedType);
		logDebug("**(double)ppPaymentMethods[" + i + "].paymentAmount:" + ppPaymentMethods[i].paymentAmount);
		logDebug("**(string)ppPaymentMethods[" + i + "].cardHolderName:" + ppPaymentMethods[i].cardHolderName);
		logDebug("**(string)ppPaymentMethods[" + i + "].ccAuthCode:" + ppPaymentMethods[i].ccAuthCode);
		logDebug("**(string)ppPaymentMethods[" + i + "].module:" + ppPaymentMethods[i].module);
	}
}
    
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