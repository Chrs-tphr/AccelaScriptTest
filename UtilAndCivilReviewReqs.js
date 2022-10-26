    if (matches(wfTask, "Traffic Engineering Review","Public Works/Engineering Review","Civil Review","Public Utilities Review","Landscape Review","Other Review", "COMIT Review", "SGA Review", "Economic Development Review")){
        revActive= false;
        tskArry = new Array();
        tskArry = loadTasks(capId);
        for(x in tskArry){
            if(matches(x,"Traffic Engineering Review","Civil Review","Public Works/Engineering Review","Public Utilities Review","Landscape Review","Other Review", "COMIT Review", "SGA Review", "Economic Development Review")){
                if(isTaskActive(x)) revActive = true;
            }
        }
        if(!revActive){
            editAppSpecific("Plan Review Tracking","Reviews Complete");
            editAppSpecific("Effective Date",dateAdd(null,0));
            editAppSpecific("Expiration Date",dateAdd(null,366));
            emailContact("Reviews Complete Permit #" + capIDString, "Your Utility permit has been approved and has been issued by City of Virginia Beach Permits & Inspections."+ "<br>" + "<br>" + etrail,"Applicant");
        }
    }