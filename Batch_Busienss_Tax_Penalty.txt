/*------------------------------------------------------------------------------------------------------/
| Program: Batch_Busienss_Tax_Penalty.js  Trigger: Batch
| Client: Fort Lauderdale, FL
| Version 1.0 Chris Godwin	12/8/2021
| This batch script will run for months October, November, December, January and February every year.
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var emailText = "";
var showDebug = true;// Set to true to see debug messages in email confirmation
var maxSeconds = 60 * 300;// number of seconds allowed for batch processing, usually < 5*60
var showMessage = false;
var useAppSpecificGroupName = true;
var br = "<BR>";
var currentUserID = "ADMIN";
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID();
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;
batchJobID = 0;
if (batchJobResult.getSuccess()) 
{
	batchJobID = batchJobResult.getOutput();
	logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID + br);
}
else
{
	logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeDate = new Date();
var startTime = timeDate.getTime();// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var timeExpired = false;
var emailAddress = aa.env.getValue("Report Email");
var sendPostal = aa.env.getValue("Send Postal to All");	
var fromDate; 
var toDate;
var statusCheck;
var statusSet;
var workAppStatus = "";
var childCapId;
var capId;
var altId;
var cap;
var appTypeResult;
var appTypeString;
var appTypeArray;
var reportParams = aa.util.newHashtable();
var reportName = "Business Tax Delinquent Notice";
var reportFile = new Array();
var inactDate = new Date();
var rUpdated = 0;
var qFeeDate = new Date();

/*----------------------------------------------GET VALUES FROM BATCH PARAMS------------------------------------------------------*/
var numDays = aa.env.getValue("numDays");//null or (-) number of days before today
var qualifyDay = aa.env.getValue("qualifyDay");//date day or newer to check for fees
var qualifyMonth = aa.env.getValue("qualifyMonth");//date month or newer to check for fees
var dlnqMultiplier = aa.env.getValue("dlnqMultiplier");//.1 for 10% or .05 for 5%
var rLimit = aa.env.getValue("rLimit");//set param to 0 for no limit

/*----------------------------------------------TEST PARAMS------------------------------------------------------/
aa.env.setValue("numDays", null);//null to use static date or (-) number of days before today to count back
aa.env.setValue("qualifyDay", 1);//date day
aa.env.setValue("qualifyMonth", 6);//date month
aa.env.setValue("dlnqMultiplier", .1);//.1 for 10% or .05 for 5%
aa.env.setValue("rLimit", 1000);
/---------------------------------------------END TEST PARAMS----------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
var paramsOK = true;
if(matches(emailAddress, null, "", undefined))
{
	emailAddress = "jcross@fortlauderdale.gov";
}
if(matches(sendPostal, null, "", undefined))
{
	sendPostal = "Y";
}
if(matches(sendPostal, null, "", undefined) || matches(emailAddress, null, "", undefined))
{
	paramsOK = false;
}
if (paramsOK) 
{
	logDebug("Start Date: " + startDate + br);
	logDebug("Starting the timer for this job.  If it takes longer than 5 minutes an error will be listed at the bottom of the email." + br);
	if (!timeExpired) 
	{
		mainProcess();
		logDebug(br+"End of Job: Elapsed Time : " + elapsed() + " Seconds");
		logDebug("End Date: " + startDate);
		aa.sendMail("noreply@fortlauderdale.gov", emailAddress, "", "Batch Job - Business Tax Penalty", emailText);
	}
}
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
function mainProcess() 
{
	logDebug("Run Date: " + startDate);
	if(startDate.getMonth()<3){
		inactDate = new Date("09/30/" + (startDate.getFullYear()-1));
		qFeeDate = new Date("07/1/" + (startDate.getFullYear()-1));
	}else{
		inactDate = new Date("09/30/" + startDate.getFullYear());
		qFeeDate = new Date("07/1/" + startDate.getFullYear());
	}
	
	logDebug("Inactive Date: " + inactDate);
	fromDate = dateAdd(inactDate, 0); 
	toDate = dateAdd(inactDate, 0);
	statusCheck = "Inactive";
	processLicenses();
}

function processLicenses(){

	// logDebug("Set currently " + statusCheck + " licenses to " + statusSet + " for date range -- From Date: " + fromDate + ", To Date: " + toDate + "." + br);
	var expResult = aa.expiration.getLicensesByDate(statusCheck, fromDate, toDate);
	if (expResult.getSuccess()){
		myExp = expResult.getOutput();
		logDebug("Processing " + myExp.length + " expiration records." + br);
	}else{
		logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage()); 
		return false;
	}
	var rCount = 0;
	for(thisExp in myExp){
		rCount += 1;
		if(rLimit>0 && rCount>rLimit)break;
		if (elapsed() > maxSeconds){
			logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}
		b1Exp = myExp[thisExp];
		var expDate = b1Exp.getExpDate();
		if (expDate){
			var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
			var b1Status = b1Exp.getExpStatus();
			capId = aa.cap.getCapID(b1Exp.getCapID().getID1(),b1Exp.getCapID().getID2(),b1Exp.getCapID().getID3()).getOutput();
			altId = capId.getCustomID();
			cap = aa.cap.getCap(capId).getOutput();	
			logDebug(br+"CAP ID : " + capId + " : ALT ID : " + altId);
			if (cap){
				appTypeResult = cap.getCapType();
				appTypeString = appTypeResult.toString();
				appTypeArray = appTypeString.split("/");
				if(appTypeArray[0] == "BusinessTax" && appTypeArray[2] == "Receipt" && appTypeArray[3] == "NA"){
					if(appTypeArray[1] != "Holiday Outdoor Sales" && appTypeArray[1] != "Liquor Measurement Request" && appTypeArray[1] != "Solicitor"){

						logDebug(": Business Tax : " + appTypeArray[1]);

						var dlnqBalance = 0;
						var dlnqFeeAmount = 0;
						var tfJsFeeDate = new Date();

						var feeResult = aa.fee.getFeeItems(capId,"",null);
						if(feeResult.getSuccess()){
							var fees = feeResult.getOutput();
							for (f in fees){
								// logDebug("----------feeResult");
								var tf = fees[f];
								var tfSeq = tf.getFeeSeqNbr();
								var tfStatus = tf.getFeeitemStatus();
								var tfCode = ""+tf.getFeeCod();
								var tfAmount = tf.getFee();
								var tpAmount = 0;
								tfJsFeeDate.setTime(tf.getApplyDate().getEpochMilliseconds());
								if(tfJsFeeDate>=qFeeDate && tfStatus=="INVOICED" && tfCode.indexOf("4")==0){
									dlnqBalance += tfAmount;
									var paymentResult = aa.finance.getPaymentFeeItems(capId, null);
									if(paymentResult.getSuccess()){
										// logDebug("----------paymentResult");
										var payments = paymentResult.getOutput();
										for(p in payments){
											var tp = payments[p];
											var tpSeq = tp.getFeeSeqNbr();
											// logDebug("tpSeq: "+tpSeq);
											if(tfSeq == tpSeq){
												tpAmount = tp.getFeeAllocation();
												if(tpAmount>0){
													dlnqBalance -= tpAmount;
												}
											}
										}
									}
								}
								// logDebug("<b>"+"Fee Date: "+(tfJsFeeDate.getMonth()+1)+"/"+tfJsFeeDate.getDate()+"/"+tfJsFeeDate.getFullYear()+", Fee Code: "+tfCode+", Fee Amount: "+tfAmount+", Balance Due: "+(tfAmount - tpAmount)+"</b>");
							}
						}

						if(dlnqBalance>0){
							dlnqFeeAmount = dlnqBalance*dlnqMultiplier;
							logDebug(" : dlnqBalance : "+dlnqBalance+" : Penalty Amount : "+dlnqFeeAmount);
							addFee("BTXDELINQ", "BT", "FINAL", dlnqFeeAmount, "Y", capId);
							rUpdated ++;
						}

						/*comment out report and email for SUPP testing*/

						var emailParams = aa.util.newHashtable();
						reportParams = aa.util.newHashtable();
						reportParams.put("Record_ID", capId);
						reportName = "Business Tax Delinquent Notice";
						reportFile = new Array();
						var conArray = getContactArray();
						var conEmail = "";
						reportFile.push(reportRunSave(reportName, false, false, true));

						if(sendPostal = "Y"){
							var setMonth;
							var setDay;
							if((startDate.getMonth() + 1) <= 9){
								setMonth = "0" + (startDate.getMonth() + 1);
							}else{
								setMonth = (startDate.getMonth() + 1);
							}
							if(startDate.getDate() <= 9){
								setDay = "0" + startDate.getDate();
							}else{
								setDay = startDate.getDate();
							}
							var setDate = setMonth + "" + setDay + "" + startDate.getFullYear();
							var setCode = "BTPENALTY" + setDate;
							var setName = "BT Penalty " + setDate;
							var setComment = "Set Created by batch script Batch_Busienss_Tax_Penalty on " + startDate;
							var setRptType = "BTRENEWAL";
							var setRptStatus = "Run Report";
							addRecordToSet(capId, setCode, setName, setComment, setRptType, setRptStatus);
						}
						if(sendPostal = "N" && matches(conEmail, null, "", undefined)){
							var setMonth;
							var setDay;
							if((startDate.getMonth() + 1) <= 9){
								setMonth = "0" + (startDate.getMonth() + 1);
							}else{
								setMonth = (startDate.getMonth() + 1);
							}
							if(startDate.getDate() <= 9){
								setDay = "0" + startDate.getDate();
							}else{
								setDay = startDate.getDate();
							}
							var setDate = setMonth + "" + setDay + "" + startDate.getFullYear();
							var setCode = "BTPENALTY" + setDate;
							var setName = "BT Penalty " + setDate;
							var setComment = "Set Created by batch script Batch_Busienss_Tax_Penalty on " + startDate;
							var setRptType = "BTRENEWAL";
							var setRptStatus = "Run Report";
							addRecordToSet(capId, setCode, setName, setComment, setRptType, setRptStatus);
						}

						/*comment out report and email for SUPP testing*/
					}
				}
			}
		}
	}logDebug(br+"Records Updated By Batch: "+rUpdated+br);
}




/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function addRecordToSet(cId, setCode, setName, setComment, setRptType, setRptStatus)
{
	var currentSet = aa.set.getSetByPK(setCode);
	if (!currentSet.getSuccess())
	{
		aa.set.createSet(setCode, setName, "CAP", setComment);
		var updateSet = aa.set.getSetByPK(setCode).getOutput();
		updateSet.setRecordSetType(setRptType);
		updateSet.setSetStatus(setRptStatus);
		updateRes = aa.set.updateSetHeader(updateSet);
		aa.set.addCapSetMember(setCode, cId);
	}
	else
	{
		setMembers = aa.set.getCAPSetMembersByPK(setCode);
		setMem = setMembers.getOutput();
		if(setMem.isEmpty())
		{
			aa.set.addCapSetMember(setCode, cId);
		}
		else
		{
			var recExists = false;
			var setMemi = setMem.iterator();
			while (setMemi.hasNext())
			{
				newId = setMemi.next();
				if (newId == capId)
				{
					recExists = true;
					break;
				}
			}
			if (!recExists)
			{
				aa.set.addCapSetMember(setCode, cId);
			}
		}
	}
}

function addRecordToSet(cId)
{
	var setCode = "DELOCT";
	var setName = "DelinquentOctober";
	var currentSet = aa.set.getSetByPK(setCode);
	if (!currentSet.getSuccess())
	{
		aa.set.createSet(setCode, setName);
		aa.set.addCapSetMember(setCode, cId);
	}
	else
	{
		setMembers = aa.set.getCAPSetMembersByPK(setCode);
		setMem = setMembers.getOutput();
		if(setMem.isEmpty())
		{
			aa.set.addCapSetMember(setCode, cId);
		}
		else
		{
			var recExists = false;
			var setMemi = setMem.iterator();
			while (setMemi.hasNext())
			{
				newId = setMemi.next();
				if (newId == capId)
				{
					recExists = true;
					break;
				}
			}
			if (!recExists)
			{
				aa.set.addCapSetMember(setCode, cId);
			}
		}
	}
}

function categoryPay(itemCap) 
{
	var feeTotal = 0;
	var gmPay = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var taPay = gmPay.getTablesArray();
	var taiPay = taPay.iterator();
	while (taiPay.hasNext())
	{
		var tsmPay = taiPay.next();
		var tnPay = tsmPay.getTableName();
		if (tnPay.equals("CATEGORY"))
		{
			if (!tsmPay.rowIndex.isEmpty())
			{
				logDebug("Table Empty: " + tsmPay.rowIndex.isEmpty());
				var tsmfldiPay = tsmPay.getTableField().iterator();
				var tsmcoliPay = tsmPay.getColumns().iterator();
				var feeCode = "";
				var endDate = new Date();
				var eDate = "";
				var unit = 1;
				var feeSeqArr = new Array();
				var payPeriodArr = new Array();
				var vetCount = 0;
				while (tsmfldiPay.hasNext())
				{
					if (!tsmcoliPay.hasNext())
					{
						var qty = unit * .1
						addFee(feeCode, "BT", "FINAL", qty, "Y", itemCap);
						var tsmcoliPay = tsmPay.getColumns().iterator();
						feeCode = "";
						endDate = new Date();
						eDate = "";
						unit = 1;
					}
					var tcolPay = tsmcoliPay.next();
					var tvalPay = tsmfldiPay.next();
					if (tcolPay.getColumnName().equals("Category"))
					{
						if (matches(tvalPay, null,"",undefined,"null"))	
						{	
							feeCode = "";	
						}else	
						{	
							feeCode = tvalPay.substring(0, 6);	
						}
					}
					if (tcolPay.getColumnName().equals("End Date"))
					{
						eDate = tvalPay;
						if(!matches(eDate, "", undefined, null))
						{
							endDate = new Date(tvalPay);
						}
					}
					if (tcolPay.getColumnName().equals("Number of Units"))
					{
						logDebug("tvalPay " + tvalPay);
						if(!matches(tvalPay, "", undefined, null, 0))
						{
							var tmpUnit = 1;
							logDebug("tvalPay.indexOf. " + tvalPay.indexOf("."));
							if (tvalPay.indexOf(".") > 0)
							{
								tmpUnit = tvalPay.substr(0, 1);
							}
							else
							{
								tmpUnit = parseInt(tvalPay);
							}
							logDebug("tmpUnit " + tmpUnit);
							unit = parseInt(tmpUnit);
						}
						logDebug("unit " + unit);
					}
				}
				var qty = unit * .1
				addFee(feeCode, "BT", "FINAL", qty, "Y", itemCap);
			}
		}
	}
}

function reportRunSave(reportName, view, edmsSave, storeToDisk) 
{
	var name = "";
	var rFile = new Array();
	var error = "";
	var reportModule = "BusinessTax";
	var reportModel = aa.reportManager.getReportModelByName(reportName); //get detail of report to drive logic
	if (reportModel.getSuccess()) 
	{
		reportDetail = reportModel.getOutput();
		name = reportDetail.getReportDescription();
		if (name == null || name == "") 
		{
			name = reportDetail.getReportName();
		}
		var reportInfoModel = aa.reportManager.getReportInfoModelByName(reportName);  //get report info to change the way report runs
		if (reportInfoModel.getSuccess()) { 
			report = reportInfoModel.getOutput();
			report.setModule(reportModule); 
			//report.setCapId(capId);
			reportInfo = report.getReportInfoModel();
			report.setReportParameters(reportParams);
			//process parameter selection and EDMS save
			if (edmsSave == true && view == true ) 
			{
				reportRun = aa.reportManager.runReport(reportParams, reportDetail);
				showMessage = true;
				comment(reportRun.getOutput()); //attaches report
				if (storeToDisk == true) 
				{
					reportInfo.setNotSaveToEDMS(false);
					reportResult = aa.reportManager.getReportResult(report); //attaches report
					if (reportResult.getSuccess()) 
					{
						reportOut = reportResult.getOutput();
						reportOut.setName(changeNameofAttachment(reportOut.getName()));
						rFile = aa.reportManager.storeReportToDisk(reportOut);
						if (rFile.getSuccess()) 
						{
							rFile = rFile.getOutput();
						} 
						else 
						{
							rFile = new Array();
							error = "Report failed to store to disk.  Debug reportFile for error message.";
							logDebug(error);
						}
					} 
					else 
					{
						rFile = new Array();
						error = "Report failed to run and store to disk.  Debug reportResult for error message.";
						logDebug(error);
					}
				} 
				else 
				{
					rFile = new Array();
				}
			} 
			else if (edmsSave == true && view == false) 
			{
				reportInfo.setNotSaveToEDMS(false);
				reportResult = aa.reportManager.getReportResult(report); //attaches report
				if (reportResult.getSuccess()) 
				{
					reportOut = reportResult.getOutput();
					reportOut.setName(changeNameofAttachment(reportOut.getName()));
					if (storeToDisk == true) 
					{
						rFile = aa.reportManager.storeReportToDisk(reportOut);
						if (rFile.getSuccess()) 
						{
							rFile = rFile.getOutput();
						} 
						else 
						{
							rFile = new Array();
							error = "Report failed to store to disk.  Debug rFile for error message.";
							logDebug(error);
						}
					} 
					else 
					{
						rFile = new Array();
					}
				} 
				else 
				{
					rFile = new Array();
					error = "Report failed to run and store to disk.  Debug reportResult for error message.";
					logDebug(error);
				}
			} 
			else if (edmsSave == false && view == true) 
			{
				reportRun = aa.reportManager.runReport(reportParams, reportDetail);
				showMessage = true;
				comment(reportRun.getOutput());
				if (storeToDisk == true) 
				{
					reportInfo.setNotSaveToEDMS(true);
					reportResult = aa.reportManager.getReportResult(report);
					if (reportResult.getSuccess()) 
					{
						reportResult = reportResult.getOutput();
						reportResult.setName(changeNameofAttachment(reportResult.getName()));
						rFile = aa.reportManager.storeReportToDisk(reportResult);
						if (rFile.getSuccess()) 
						{
							rFile = rFile.getOutput();
						} 
						else 
						{
							rFile = new Array();
							error = "Report failed to store to disk.  Debug rFile for error message.";
							logDebug(error);
						}
					} 
					else 
					{
						rFile = new Array();
						error = "Report failed to run and store to disk.  Debug reportResult for error message.";
						logDebug(error);
					}
				} 
				else 
				{
					rFile = new Array();
				}
			} 
			else if (edmsSave == false && view == false) 
			{
				if (storeToDisk == true) 
				{
					reportInfo.setNotSaveToEDMS(true);
					reportResult = aa.reportManager.getReportResult(report);
					if (reportResult.getSuccess()) 
					{
						reportResult = reportResult.getOutput();
						reportResult.setName(changeNameofAttachment(reportResult.getName()));
						rFile = aa.reportManager.storeReportToDisk(reportResult);
						logDebug("Report File: " + rFile.getSuccess());
						if (rFile.getSuccess()) 
						{
							rFile = rFile.getOutput();
							logDebug("Actual Report: " + rFile);
						} 
						else 
						{
							rFile = new Array();
							error = "Report failed to store to disk.  Debug rFile for error message.";
							logDebug(error);
						}
					}
					else 
					{
						rFile = new Array();
						error = "Report failed to run and store to disk.  Debug reportResult for error message.";
						logDebug(error);
					}
				} 
				else 
				{
					rFile = new Array();
				}
			}
		} 
		else 
		{
			rFile = new Array();
			error = "Failed to get report information.  Check report name matches name in Report Manager.";
			logDebug(error);
		}
	} 
	else 
	{
		rFile = new Array();
		error = "Failed to get report detail.  Check report name matches name in Report Manager.";
		logDebug(error);
	}
	function changeNameofAttachment(attachmentName) 
	{
		rptExtLoc = attachmentName.indexOf(".");
		rptLen = attachmentName.length();
		ext = attachmentName.substr(rptExtLoc, rptLen);
		attachName = name + ext;
		return attachName
	}	
	return rFile;
}

function sendNotification(emailFrom, emailTo, emailCC, templateName, params, reportFile)
{
	var itemCap = capId;
	if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args
	var id1 = itemCap.ID1;
 	var id2 = itemCap.ID2;
 	var id3 = itemCap.ID3;
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if(result.getSuccess())
	{
		logDebug("Sent email successfully!");
		return true;
	}
	else
	{
		logDebug("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}

function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}

function getPrimaryAddressLineParam4Notification(params)
{
	// pass in a hashtable and it will add the additional parameters to the table
    var addressLine = "";
	adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");
	if (adResult.getSuccess()) 
	{
		ad = adResult.getOutput().getAddressModel();
		addParameter(params, "$$addressLine$$", ad.getDisplayAddress());
	}
	return params;
}

function updateAppStatus(stat,cmt) 
{
	var thisCap = capId;
	if (arguments.length > 2) thisCap = arguments[2];
	updateStatusResult = aa.cap.updateAppStatus(thisCap, "APPLICATION", stat, sysDate, cmt, systemUserObj);
	//if (!updateStatusResult.getSuccess()) 
	//{
		//logDebug("ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + 
		//updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
	//} 
	//else 
	//{
	//	logDebug("Application Status updated to " + stat);
	//}
}

function getContactArray()
{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid
	// added check for ApplicationSubmitAfter event since the contactsgroup array is only on pageflow,
	// on ASA it should still be pulled normal way even though still partial cap
	var thisCap = capId;
	if (arguments.length == 1) thisCap = arguments[0];
	var cArray = new Array();
	if (arguments.length == 0 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") // we are in a page flow script so use the capModel to get contacts
	{
	capContactArray = cap.getContactsGroup().toArray() ;
	}
	else
	{
	var capContactResult = aa.people.getCapContactByCapID(thisCap);
	if (capContactResult.getSuccess())
		{
		var capContactArray = capContactResult.getOutput();
		}
	}

	if (capContactArray)
	{
	for (yy in capContactArray)
		{
		var aArray = new Array();
		aArray["lastName"] = capContactArray[yy].getPeople().lastName;
		aArray["refSeqNumber"] = capContactArray[yy].getCapContactModel().getRefContactNumber();
		aArray["firstName"] = capContactArray[yy].getPeople().firstName;
		aArray["middleName"] = capContactArray[yy].getPeople().middleName;
		aArray["businessName"] = capContactArray[yy].getPeople().businessName;
		aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
		aArray["contactType"] =capContactArray[yy].getPeople().contactType;
		aArray["relation"] = capContactArray[yy].getPeople().relation;
		aArray["phone1"] = capContactArray[yy].getPeople().phone1;
		aArray["phone2"] = capContactArray[yy].getPeople().phone2;
		aArray["email"] = capContactArray[yy].getPeople().email;
		aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
		aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
		aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
		aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
		aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
		aArray["fax"] = capContactArray[yy].getPeople().fax;
		aArray["notes"] = capContactArray[yy].getPeople().notes;
		aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
		aArray["fullName"] = capContactArray[yy].getPeople().fullName;
		aArray["peopleModel"] = capContactArray[yy].getPeople();

		var pa = new Array();

		if (arguments.length == 0 && !cap.isCompleteCap()) {
			var paR = capContactArray[yy].getPeople().getAttributes();
			if (paR) pa = paR.toArray();
			}
		else
			var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
				for (xx1 in pa)
					aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;

		cArray.push(aArray);
		}
	}
	return cArray;
}

function getAppSpecific(itemName) 
{ // optional: itemCap
	var updated = false;
	var i=0;
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args
	if (useAppSpecificGroupName) 
	{
		if (itemName.indexOf(".") < 0) 
		{
			//logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true"); 
			return false 
		}
		var itemGroup = itemName.substr(0,itemName.indexOf("."));
		var itemName = itemName.substr(itemName.indexOf(".")+1);
	}
	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess()) 
	{
		var appspecObj = appSpecInfoResult.getOutput();
		if (itemName != "") 
		{
			for (i in appspecObj) 
			{
				if( appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup) )
				{
					return appspecObj[i].getChecklistComment();
					break;
				}
			}
		}
	} 
	//else 
	//{ 
	//	logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage())
	//}
}

function updateTask(wfstr, wfstat, wfcomment, wfnote) // optional process name, cap id
{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 4) 
	{
		if (arguments[4] != "") 
		{
			processName = arguments[4]; // subprocess
			useProcess = true;
		}
	}
	var itemCap = capId;
	if (arguments.length == 6)
	{
		itemCap = arguments[5]; // use cap ID specified in args
	}
	var workflowResult = aa.workflow.getTaskItems(itemCap, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
	{
		var wfObj = workflowResult.getOutput();
	}
	else 
	{
		//logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	if (!wfstat)
	{
		wfstat = "NA";
	}
	for (i in wfObj)
	{
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) 
		{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			if (useProcess)
			{
				aa.workflow.handleDisposition(itemCap, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "U");
				//logDebug("Updating Workflow Task " + wfstr + " with status " + wfstat);
			}
			else
			{
				aa.workflow.handleDisposition(itemCap, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "U");
				//logDebug("Updating Workflow Task " + wfstr + " with status " + wfstat);
			}
		}
	}
}

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
	// Updated Script will return feeSeq number or null if error encountered (SR5112)
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array(); // invoicing fee for CAP in args
	var paymentPeriod_L = new Array(); // invoicing pay periods for CAP in args
	var feeSeq = null;
	if (arguments.length > 5) 
	{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
	}
	assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
	if (assessFeeResult.getSuccess()) {
		feeSeq = assessFeeResult.getOutput();
		//logDebug("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
		//logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);
		if (finvoice == "Y" && arguments.length == 5) // use current CAP
		{
			feeSeqList.push(feeSeq);
			paymentPeriodList.push(fperiod);
		}
		if (finvoice == "Y" && arguments.length > 5) // use CAP in args
		{
			feeSeq_L.push(feeSeq);
			paymentPeriod_L.push(fperiod);
			var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
			//if (invoiceResult_L.getSuccess())
			//	logDebug("Invoicing assessed fee items" + feeCapMessage + " is successful.");
			//else
			//	logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
		}
		updateFeeItemInvoiceFlag(feeSeq, finvoice);
	} 
	else 
	{
		//logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		feeSeq = null;
	}
	return feeSeq;
}

function updateFeeItemInvoiceFlag(feeSeq, finvoice)
{
	if(feeSeq == null)
		return;
	if(!cap.isCompleteCap())
	{
		var feeItemScript = aa.finance.getFeeItemByPK(capId,feeSeq);
		if(feeItemScript.getSuccess)
		{
			var feeItem = feeItemScript.getOutput().getF4FeeItem();
			feeItem.setAutoInvoiceFlag(finvoice);
			aa.finance.editFeeItem(feeItem);
		}
	}
}

function dateAdd(td,amt) 
{
	// perform date arithmetic on a string
	// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
	// amt can be positive or negative (5, -3) days
	if (!td) 
	{
		dDate = new Date();
	} 
	else 
	{
		dDate = convertDate(td);
	}
	//var i = 0;
	//while (i < Math.abs(amt)) 
	//{
	//	dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth()+1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
	//	i++;
	//}
	dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));
	return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
}

function dateAddMonths(pDate, pMonths) {
	// Adds specified # of months (pMonths) to pDate and returns new date as string in format MM/DD/YYYY
	// If pDate is null, uses current date
	// pMonths can be positive (to add) or negative (to subtract) integer
	// If pDate is on the last day of the month, the new date will also be end of month.
	// If pDate is not the last day of the month, the new date will have the same day of month, unless such a day doesn't exist in the month, 
	// in which case the new date will be on the last day of the month
	if (!pDate) {
		baseDate = new Date();
	} else {
		baseDate = convertDate(pDate);
	}
	var day = baseDate.getDate();
	baseDate.setMonth(baseDate.getMonth() + pMonths);
	if (baseDate.getDate() < day) {
		baseDate.setDate(1);
		baseDate.setDate(baseDate.getDate() - 1);
		}
	return ((baseDate.getMonth() + 1) + "/" + baseDate.getDate() + "/" + baseDate.getFullYear());
}

function convertDate(thisDate) {
	//converts date to javascript date
	if (typeof(thisDate) == "string") {
		var retVal = new Date(String(thisDate));
		if (!retVal.toString().equals("Invalid Date"))
		return retVal;
	}
	if (typeof(thisDate)== "object") {
		if (!thisDate.getClass) {// object without getClass, assume that this is a javascript date already 
			return thisDate;
		}
		if (thisDate.getClass().toString().equals("class com.accela.aa.emse.dom.ScriptDateTime")) {
			return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
		}
		if (thisDate.getClass().toString().equals("class java.util.Date")) {
			return new Date(thisDate.getTime());
		}
		if (thisDate.getClass().toString().equals("class java.lang.String")) {
			return new Date(String(thisDate));
		}
	}
	if (typeof(thisDate) == "number") {
		return new Date(thisDate);  // assume milliseconds
	}
	logDebug("**WARNING** convertDate cannot parse date : " + thisDate);
	return null;
}

function jsDateToMMDDYYYY(pJavaScriptDate) {
	//converts javascript date to string in MM/DD/YYYY format
	if (pJavaScriptDate != null) {
		if (Date.prototype.isPrototypeOf(pJavaScriptDate)) {
			return (pJavaScriptDate.getMonth()+1).toString()+"/"+pJavaScriptDate.getDate()+"/"+pJavaScriptDate.getFullYear();
		} else {
			logDebug("Parameter is not a javascript date");
			return ("INVALID JAVASCRIPT DATE");
		}
	} else {
		logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
	}
}

function matches(eVal, argList) {
	for (var i = 1; i < arguments.length; i++) {
		if (arguments[i] == eVal) {
			return true;
		}
	}
	return false;
} 

function debugObject(object) {
	 var output = ''; 
	 for (property in object) { 
	   output += "<font color=red>" + property + "</font>" + ': ' + "<bold>" + object[property] + "</bold>" +'; ' + "<BR>"; 
	 } 
	 logDebug(output);
} 

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function logDebug(dstr) {
	if(showDebug) {
		aa.print(dstr)
		emailText += dstr + "<br>";
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)
	}
}

function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

function feeAmount(feestr, itemCap) {
	// optional statuses to check for (SR5082)
	//
	var checkStatus = false;
	var statusArray = new Array();

	//get optional arguments
	if (arguments.length > 1) {
		checkStatus = true;
		for (var i = 1; i < arguments.length; i++)
			statusArray.push(arguments[i]);
	}

	var feeTotal = 0;
	var feeResult = aa.fee.getFeeItems(itemCap, feestr, null);
	if (feeResult.getSuccess()) {
		var feeObjArr = feeResult.getOutput();
	} else {
		logDebug("**ERROR: getting fee items: " + feeResult.getErrorMessage());
		return false
	}

	for (ff in feeObjArr)
		if (feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(), statusArray)))
			feeTotal += feeObjArr[ff].getFee()

			return feeTotal;
} 
 

//Parameter 1 = CapId, Parameter 2 to n = Fee Code to ignore
function feeAmountExcept(checkCapId) 
	{
   	var checkStatus = false;
	var exceptArray = new Array(); 
	//get optional arguments 
	if (arguments.length > 1)
		{
		checkStatus = true;
		for (var i=1; i<arguments.length; i++)
			exceptArray.push(arguments[i]);
		}
        
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(checkCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }
	
	for (ff in feeObjArr)
		if ( !checkStatus || !exists(feeObjArr[ff].getFeeCod(),exceptArray) )
			feeTotal+=feeObjArr[ff].getFee()
			
	return feeTotal;
	}
 
function feeGetTotByDateRange(pStartDate, pEndDate) 
	// gets total for fees assessed during date range
	// optional fee statuses to check for						
	{
	//get End and Start Dates
	var jsStartDate = new Date(pStartDate);
	jsStartDate.setHours(0,0,0,0); //Bring StartDate to 00:00 AM
	var jsEndDate = new Date(pEndDate);
	jsEndDate.setHours(23,59,59,999); //Bring EndDate close to midnight
	
	//logDebug("Start Date: "+ (jsStartDate.getMonth()+1).toString() +"/"+jsStartDate.getDate()+"/"+jsStartDate.getFullYear() + " End Date: " + (jsEndDate.getMonth()+1).toString() +"/"+jsEndDate.getDate()+"/"+jsEndDate.getFullYear());

	//get optional arguments 
	var checkStatus = false;
	var statusArray = new Array(); 
	if (arguments.length > 2)
		{
		checkStatus = true;
		for (var i=2; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	//get all feeitems on CAP
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }
	
	//get total applicable fees
	var feesTotal = 0;
	var jsFeeDate = new Date();
	for (ff in feeObjArr)
		{
		jsFeeDate.setTime(feeObjArr[ff].getApplyDate().getEpochMilliseconds());
		//logDebug("Fee Apply Date: "+(jsFeeDate.getMonth()+1).toString() +"/"+ jsFeeDate.getDate()+"/"+jsFeeDate.getFullYear());
		if (jsFeeDate  >= jsStartDate && jsFeeDate <= jsEndDate && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			{
			feesTotal += feeObjArr[ff].getFee(); 
			//logDebug("Added to Total: "+feeObjArr[ff].getFee());
			}
		}
			
	return feesTotal;
	}