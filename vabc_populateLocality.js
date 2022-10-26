function populateLocality() {
    //	Update Locality custom field with County and City
    var propertyAddress = getPropertyAddress(capId);
    if (propertyAddress != null) {
        var locality = "";
        var county = propertyAddress.getCounty();
        if (county != null && county != "") {
            //  County is in Address tab
            locality = (String(county).toUpperCase().indexOf(" COUNTY") > -1 || String(county).toUpperCase().indexOf(" CITY") > -1) ? String(county).trim() : String(county).trim() + " County";
            var lookupLocality = locality.indexOf("-") > -1 ? capitalizeFirstLetters(locality) : capitalizeFirstLetters(locality) + "-";
            var lookedupLocality = lookup("Locality_Notification_Lookup", lookupLocality);
            if (lookedupLocality != null && lookedupLocality != "") {
                //  County found in standard choice list
                editAppSpecific("Locality", lookupLocality);
                var city = propertyAddress.getCity();
                if (city != null && city != "") {
                    //  City is in Address tab
                    lookupLocality = lookupLocality + capitalizeFirstLetters(String(city).trim());
                    lookedupLocality = lookup("Locality_Notification_Lookup", lookupLocality);
                    if (lookedupLocality != null && lookedupLocality != "") {
                        //  City found in standard choice list
                        editAppSpecific("Locality", lookupLocality);
                    } else {
                        //  City not found in standard choice list
                        logDebug("City was not found for Record # " + capId.getCustomID() + ", Locality custom field shows County only.");
                    }
                } else {
                    //  City is not in Address tab
                    logDebug("City is null for Record # " + capId.getCustomID() + ", Locality custom field shows County only.");
                }
            } else {
                //  County is not found in standard choice list
                logDebug("County was not found for Record # " + capId.getCustomID() + ", Locality not found.")
                editAppSpecific("Locality", "Locality Not Found-")
            }
        } else {
            //  County is not in Address tab
            logDebug("County is null for Record # " + capId.getCustomID() + ", Locality not found.");
            editAppSpecific("Locality", "Locality Not Found-")
        }
    }
    function capitalizeFirstLetters(stringToCapitalize) {
        if (typeof stringToCapitalize != "string") {
          return logDebug("capitalizeFirstLetters didn't recognize as a string"), stringToCapitalize;
        } else {
          stringToCapitalize = stringToCapitalize.charAt(0).toUpperCase() + stringToCapitalize.slice(1).toLowerCase();
          var indiciesOfSpace = [];
          for (var i=0;i<stringToCapitalize.length;i++) {
            if (stringToCapitalize[i] == " ") {
              indiciesOfSpace.push(i);
            }
          }
          for (var s in indiciesOfSpace) {
            var theSpace = indiciesOfSpace[s];
            stringToCapitalize = stringToCapitalize.substr(0, theSpace)
            + " "
            + stringToCapitalize.charAt(theSpace + 1).toUpperCase() + stringToCapitalize.slice(theSpace + 2).toLowerCase();
          }
        }
        return stringToCapitalize;
    }
}
