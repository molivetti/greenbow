
// Load all images via Squarespace's Responsive ImageLoader
function loadAllImages() {
  var images = document.querySelectorAll('img[data-src]' );
  for (var i = 0; i < images.length; i++) {
    ImageLoader.load(images[i], {load: true});
  }
}

function displayContent( title, content ){
  $("#contentContainer").hide();

  var headerElement = "<h1 class='text-align-center'><strong>" + title + "</strong></h1>";
  $("#contentContainer").html(headerElement + content);
  loadAllImages();
  setupVideoLinks();

  $("#contentContainer").fadeIn("fast");
};

function populateFolderNav( folder ){
  var nav = $("#folderNav nav");
  var teamLogo = $("<img>").attr("id", "teamLogo");
  teamLogo.attr("src", "/s/" + folder.urlId + "Logo.jpg");
  nav.append(teamLogo);

  var ul = $("<ul>");
  var teamNameNav = $("<li>").attr("id","teamNameNav");
  teamNameNav.attr("class","nav-section-label");
  teamNameNav.text(folder.title);
  ul.append(teamNameNav);

  $(folder.collections).each(function(index){
    var sectionLinkContainer = $("<li>").attr("class","sectionLinkContainer");
    var sectionLink = $("<a>").attr("class","sectionLink");
    sectionLink.attr("href","#");
    sectionLink.attr("data-href",this.fullUrl);
    sectionLink.text(this.navigationTitle);

    sectionLinkContainer.append(sectionLink);
    ul.append(sectionLinkContainer);
  })

  nav.append(ul);
  $("#folderNav").show();
}

function populateSeasonMenus(){
  $(clientWorkouts).each(function(index){

    var customWeekNumber = index + 1;
    
    var link = $("<a>");
    link.addClass( "dropdown-item" );
    link.data( "workoutId",   index)

    if (this.isOffWeek){
      link.addClass( "disabled" );
      link.html( "Week " + customWeekNumber + " - OFF" );
    } else if (this.content == "") {
      link.addClass( "disabled" );
      link.html( "Week " + customWeekNumber );
    } else {
      link.attr( "href",  "#" );
      link.html( "Week " + customWeekNumber );
    }

    var seasonMenu;
    switch ( this.seasonNumber ) {
      case 1:
        seasonMenu = $("#offseasonMenu");
        break;
      case 2:
        seasonMenu = $("#preseasonMenu");
        break;
      case 3:
        seasonMenu = $("#inseasonMenu");
        break;
      case 4:
        seasonMenu = $("#postseasonMenu");
        break;
    }

    seasonMenu.append(link);
    $(seasonMenu).parent().show();

  });
};

function clearSideNavActiveLink(){
  $(".sectionLinkContainer").each(function(){
    $(this).removeClass("active-link");
  });
};
function clearDropdownActiveLink(){
  $(".dropdown-item").each(function(){
    $(this).removeClass("active");
  });
};
function clearTabActiveLink(){
  $(".nav-link").each(function(){
    $(this).removeClass("active");
  });
};
function clearActive(){
  clearSideNavActiveLink();
  clearDropdownActiveLink();
  clearTabActiveLink();
};

function addSideNavListeners(){

  $(".sectionLink").each(function(){
    $(this).click(function(event) {
      event.preventDefault();

      clearActive();
      var parentContainer = $(this).parent()[0];
      $(parentContainer).addClass("active-link");

      //Create URL query string to prevent cache load
      var randomNumber = (new Date()).getTime(); 
      $.ajax({
        url: $(this).data("href")+"?q="+randomNumber, 
        data: {format:"json"}, 
        dataType: "json", 
        method: "GET"
      })
      .done(
        function(data){
          displayContent(data.collection.navigationTitle, data.mainContent);
        }
      );

    });
  });
};

function addCurrentWeekListener(){
  $("#currentWorkoutTab .nav-link").click(function(event){
    event.preventDefault();

    clearActive();
    $(this).addClass("active");

    $(clientWorkouts).each(function(index){
      if (this.seasonNumber == clientPlan.currentSeasonNumber && this.weekNumber == clientPlan.currentWeekNumber){
        displayContent("Week " + (index+1), this.content);
      }
    });
  })
}

function addWorkoutWeekListeners(){

  $("#workoutTabs .nav-item .dropdown-menu .dropdown-item:not(.disabled)").each(function(){

    $(this).click(function(event) {

      event.preventDefault(); 

      clearActive();
      $(this).addClass("active");
      $($($(this).parent()[0]).siblings(".nav-link.dropdown-toggle")[0]).addClass("active");

      var workoutIdClicked = $(this).data("workoutId");
      var workoutWeekNumber = workoutIdClicked + 1;
      
      displayContent("Week " + workoutWeekNumber, clientWorkouts[workoutIdClicked].content);

    });
  });
};

function setupVideoLinks(){
  $("#contentContainer a").each(function(){
    var url = this.href;
    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      var videoId = match[2];
      var key = "AIzaSyAB9zUaNqJe1JlCIfpFaFZ_SQE5fdAiJJc";
      var youtubeUrl = "https://www.googleapis.com/youtube/v3/videos?id="+videoId+"&key="+key+"&part=snippet&callback=?";

      $(this).click(function(event){
        event.preventDefault();
        $.getJSON(youtubeUrl,function(data){
          if (typeof(data.items[0]) != "undefined") {
            var formattedVideoUrl = "https://www.youtube.com/embed/" + videoId + "?rel=0&amp;showinfo=0&amp;modestbranding=1&amp;autoplay=1";

            $("#videoModal .modal-title").text(data.items[0].snippet.title);
            $("#videoIframe").attr("src", formattedVideoUrl);

            var description = data.items[0].snippet.description;
            //Remove unicode bullets
            description = description.replace(/\u2022\s*/g,"");
            description = description.split(/\n/);
            if ( description.length > 1 ){
              var list = $("<ul>")
              $(description).each(function(){
                var listItem = $("<li>").text(this);
                list.append(listItem);
              });
              $("#videoModal .modal-footer").html(list);
            } else {
              $("#videoModal .modal-footer").text(description);
            }

            $("#videoModal").modal();

          } else {
            console.log('video not exists');
          }   
        });
      });

    }; 
  });
}

function getSeasonNumber( seasonPrefix ){
    switch ( seasonPrefix.toUpperCase() ) {
      case "OFF":
        return 1;
      case "PRE":
        return 2;
      case "IN":
        return 3;
      case "POST":
        return 4;
    }
}

function isDevEnvironment(){
  if ( $(location)[0].hostname == "localhost" || $(location)[0].hostname == "molivetti.github.io" ){
    return true;
  } else {
    return false;
  }
}

function getPlans(){
  if ( isDevEnvironment() ){
    return $.getJSON("scripts/testData/plans.json");
  } else {
    //Create URL query string to prevent cache load
    var randomNumber = (new Date()).getTime(); 
    return $.ajax({
      url: "/plans?q="+randomNumber, 
      data: {format:"json"}, 
      dataType: "json", 
      method: "GET"
    });
  }
}
function getWorkouts(){  
  if ( isDevEnvironment() ){
    return $.getJSON("scripts/testData/workouts.json");
  } else {
    //Create URL query string to prevent cache load
    var randomNumber = (new Date()).getTime(); 
    return $.ajax({
      url: "/workouts?q="+randomNumber, 
      data: {format:"json"}, 
      dataType: "json", 
      method: "GET"
    });
  }
}
function getConfig(){  
  if ( isDevEnvironment() ){
    return $.getJSON("scripts/testData/config.json");
  } else {
    //Create URL query string to prevent cache load
    var randomNumber = (new Date()).getTime(); 
    return $.ajax({
      url: "?q="+randomNumber, 
      data: {format:"json"}, 
      dataType: "json", 
      method: "GET"
    });
  }
}

var planId = "";
var clientPlan = {};
var clientWorkouts = [];

$(document).ready(function(){

  $.when( getPlans(), getWorkouts(), getConfig() ).done( function( plans, workouts, config ){

    planId = config[0].collection.urlId.toUpperCase();
    
    //Client plan info
    $(plans[0].items).each(function(){
      if ( this.customContent.planId.toUpperCase() == planId ){
        clientPlan.planId = this.customContent.planId.toUpperCase();
        clientPlan.clientFullName = this.customContent.clientFullName;
        clientPlan.gender = this.customContent.gender.toUpperCase();
        clientPlan.level = this.customContent.level.toUpperCase();
        clientPlan.currentSeasonNumber = getSeasonNumber(this.customContent.currentSeason.toUpperCase());
        clientPlan.currentWeekNumber = this.customContent.currentWeekNumber;
      }
    });
    //Client workouts
    $(workouts[0].items).each(function(){
      if (  
        this.customContent.gender.toUpperCase() == clientPlan.gender.toUpperCase() && 
        this.customContent.level.toUpperCase()  == clientPlan.level.toUpperCase() && 
        (this.customContent.planId.toUpperCase() == clientPlan.planId.toUpperCase() || this.customContent.planId.toUpperCase() == "")
      ){
        var newWorkout = {};
        newWorkout["planId"] = this.customContent.planId.toUpperCase();
        newWorkout["weekNumber"] = this.customContent.weekNumber;
        newWorkout["seasonNumber"] = getSeasonNumber(this.customContent.season.toUpperCase());
        newWorkout["gender"] = this.customContent.gender.toUpperCase();
        newWorkout["level"] = this.customContent.level.toUpperCase();
        newWorkout["isOffWeek"] = this.customContent.isOffWeek;
        newWorkout["content"] = this.body;

        var workoutExists = false;
        $(clientWorkouts).each(function(index){
          if (
            this["weekNumber"] == newWorkout["weekNumber"] &&
            this["seasonNumber"] == newWorkout["seasonNumber"] &&
            this["gender"] == newWorkout["gender"] &&
            this["level"] == newWorkout["level"] &&
            this["planId"] != "" 
          ){
            workoutExists = true;
          } else if (
            this["weekNumber"] == newWorkout["weekNumber"] &&
            this["seasonNumber"] == newWorkout["seasonNumber"] &&
            this["gender"] == newWorkout["gender"] &&
            this["level"] == newWorkout["level"] &&
            this["planId"] == "" &&
            newWorkout["planId"] != "" 
          ){
            clientWorkouts.splice(index, 1);
          } 
        })
        if (!workoutExists){
          clientWorkouts.push(newWorkout);
        }
      }
    });
    clientWorkouts.sort(function(a, b) {
      return a.seasonNumber - b.seasonNumber  ||  a.weekNumber - b.weekNumber;
    });

    populateFolderNav( config[0].collection );
    populateSeasonMenus();
    addWorkoutWeekListeners();
    addSideNavListeners();

    if (clientPlan.currentSeasonNumber != undefined && clientPlan.currentWeekNumber != undefined){
      addCurrentWeekListener();
      $("#currentWorkoutTab").show();
      $("#currentWorkoutTab a.nav-link").click();
    } else {
      $(".folder-nav ul li.sectionLinkContainer .sectionLink").first().click();
    }

  });



});