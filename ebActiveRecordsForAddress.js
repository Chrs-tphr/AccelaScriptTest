var streetName = seshVar1;
var houseNum = seshVar2;
var streetSuffix = seshVar3;
var postalCode = seshVar4;
var streetDirection = seshVar5;
var cList = aa.cap.getCapListByDetailAddress(streetName, houseNum, streetSuffix, postalCode, streetDirection, null).getOutput();
var message = "";
if(cList.length() > 0){
    message = "Active permits for address:";
    for(c in cList){
        var altID = cList[c].getAltID();
        message += " "+altID;
    }
}else(
    message = "No Active permits for address found.";
)

form.setMessage(message);

