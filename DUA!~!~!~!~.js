try{

    //Send emails to Planning Department when doc is uploaded in ACA
    var capType = cap.getCapType().toString(); //logDebug("capType: "+capType+", typeOf: "+typeof capType);
    var capTypeArray = [];
    capTypeArray = capType.split("/");
    var toEmail = null;
    
    //Only in ACA
	if(publicUser){
        //set toStaffEmail by cap type
        //Permit/*/*/*
        
        //Permits/Utility/NA/NA
        if(matches(capTypeArray[0], "Permits", "Planning")&&!matches(capType, "Permits/Utility/NA/NA")){
            var tDescArray = [];
            toEmail = 
        }
        //Permit/Utility/NA/NA
        if(matches(capType, "Permits/Utility/NA/NA")){
            toEmail = "piutility@vbgov.com";
        }
        
        var fromEmail = "OnlinePermitting@vbgov.com";
        var emailSubject = "";
        var emailBody = "";
        email(toEmail,fromEmail,emailSubject,emailBody);

    }
}catch(err){
	logDebug("An error occurred in DUA:*/*/*/*: UTIL 3: " + err. message);
	logDebug(err.stack);
}
