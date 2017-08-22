$( document ).ready(function(){
   $(".button-collapse").sideNav();
   $(".dropdown-button").dropdown({ constrainWidth: false });
   $('.collapsible').collapsible();
   $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: true, // Creates a dropdown of 15 years to control year
    firstDay: 1
  });
})
