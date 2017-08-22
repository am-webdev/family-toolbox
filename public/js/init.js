$( document ).ready(function(){
   $(".button-collapse").sideNav();
   $(".dropdown-button").dropdown({
      constrainWidth: false
   });
   $('.collapsible').collapsible();
   $('.datepicker').pickadate({
      selectMonths: true,
      selectYears: true,
      firstDay: 1  // Monday as first day of week
   });
})
