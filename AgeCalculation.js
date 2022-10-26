var birth = new Date("1/1/1922"); console.log("birth: "+birth);
var death = new Date("2/4/2022"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

var birth = new Date("1/1/2021"); console.log("birth: "+birth);
var death = new Date("2/4/2022"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

var birth = new Date("10/1/2021"); console.log("birth: "+birth);
var death = new Date("2/4/2022"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

var birth = new Date("1/1/2022"); console.log("birth: "+birth);
var death = new Date("2/4/2022"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

var birth = new Date("2/1/2022"); console.log("birth: "+birth);
var death = new Date("2/4/2022"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

var birth = new Date("2/4/2020"); console.log("birth: "+birth);
var death = new Date("3/5/2020"); console.log("death: "+death);
console.log("ageInYears: "+ageInYears(birth,death));
console.log("ageInMonths: "+ageInMonths(birth,death));
console.log("ageInDays: "+ageInDays(birth,death));
console.log("calculatedAgeOutput: "+calculatedAge(birth,death));
console.log("");console.log("");

//supporting functions
function ageInYears(bDate,dDate){
  var age = 0;
  var bYear = bDate.getFullYear();
  var bMonth = bDate.getMonth()+1;
  var bDay = bDate.getDate();
  var dYear = dDate.getFullYear();
  var dMonth = dDate.getMonth()+1;
  var dDay = dDate.getDate();

  var diffYear = dYear-bYear;
  var diffMonth = dMonth-bMonth;
  var diffDay = dDay-bDay;

  if((diffMonth<0)||(diffMonth==0 && diffDay<0)){
    return diffYear-1;
  }else{
    return diffYear;
  }
}

function ageInMonths(bDate,dDate){
  var age = 0;
  var bYear = bDate.getFullYear();
  var bMonth = bDate.getMonth()+1;
  var bDay = bDate.getDate();
  var dYear = dDate.getFullYear();
  var dMonth = dDate.getMonth()+1;
  var dDay = dDate.getDate();

  var diffYear = dYear-bYear;
  var diffMonth = dMonth-bMonth;
  var diffDay = dDay-bDay;

  if((diffMonth>-1 && diffDay>-1)){
    return diffMonth+(diffYear*12);
  }else{
    return ((diffYear - 1) * 12) + (diffMonth + 12);
  }
}

function ageInDays(bDate,dDate){
  return Math.round((dDate-bDate)/86400000);
}

function calculatedAge(bDate,dDate){
  if(ageInYears(bDate,dDate)>0){
    return ageInYears(bDate,dDate)+" Year(s)";
  }else if(ageInMonths(bDate,dDate)>0){
    return ageInMonths(bDate,dDate)+" Month(s)";
  }else{
    return ageInDays(bDate,dDate)+" Day(s)";
  }
}