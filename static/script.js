// set dynamic placeholder date
var currentDate = new Date();
// get current Date, call function to make it into string
var formattedCurrentDate = (currentDate.getMonth() + 1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear();
$("input[name=EndDate]").attr("placeholder", formattedCurrentDate); // set place holder for enddate

// do the same for start date, which is set to be yesterday
var yesterday = new Date();
yesterday.setDate(currentDate.getDate() - 1); // get the previous date
var formattedYesterday = (yesterday.getMonth() + 1) + "/" + yesterday.getDate() + "/" + yesterday.getFullYear();
$("input[name=StartDate]").attr("placeholder", formattedYesterday); // set the placeholder for startdate

// call datepicker function to get date string from user input
$("input[name=StartDate]").datepicker();
$("input[name=EndDate]").datepicker();


$(document).ready(function () {

    // the result obtained from twitter through python, used for two different click function
    var jsObject;

    // function for parametric-search when button is clicked, output the search result in a table
    $("#getInfo").click(function () {

        // get all the keyword parameters in proper forms and strip space in them
        var Keyword = $("input[name=Keyword]").val().trim();
        var AndKeyword = $("input[name=AND]").val().trim();
        var OrKeyword = $("input[name=OR]").val().trim();


        // use twitter advanced search operator for advanced searching
        if (Keyword == "") { // do nothing if input keyword is empty
        }
        // if 'and' is checked: search for intersectin
        else if ($("#AND_box").is(":checked")) {
            if (AndKeyword == "" || AndKeyword.length == 0 || AndKeyword == null) {} // if input is empty, do nothing with search keyword
            else {
                Keyword += " " + AndKeyword;
            }
        }
        // if 'or' is checked: search for union
        else if ($("#OR_box").is(":checked")) {
            if (OrKeyword == "" || OrKeyword.length == 0 || OrKeyword == null) {} // if input is empty, do nothing with search keyword
            else {
                Keyword += " OR " + OrKeyword;
            }
        }
        // if 'exact' is checked: search for exact words
        else if ($("#exact").is(":checked")) {
            Keyword = '"' + Keyword + '"';
        }


        // encode the keyword (i.e. symbols) to proper form
        var EncodedKeyword = fixedEncodeURIComponent(Keyword);


        // check if the input keyword is empty or not
        if (EncodedKeyword == "" || EncodedKeyword.length == 0 || EncodedKeyword == null) {
            // when its empty
            EncodedKeyword = "";
        } else {
            EncodedKeyword = "term=" + EncodedKeyword;
        }


        // get the input data for the url address to access twitter data, and change it if input is empty

        // check if there is input for count 
        var count = $("input[name=NumberOfResult]").val();
        var Count;
        if (count == "" || count.length == 0 || count == null) { // i.e. count is empty
            Count = "";
        } else {
            Count = "&count=" + count;
        }


        // get location code here: if checked, only charlottesville; otherwise no restriction
        var Location;
        if ($("#Location").is(":checked")) {
            Location = "&geocode=" + $("input[name=Location]").val();
        } else {
            Location = "";
        }


        // get date info for StartDate and EndDate
        var StartDate = $("input[name=StartDate]").val();
        var EndDate = $("input[name=EndDate]").val();

        // change the startdate to proper format, leave empty if no input
        var StartDateString;
        if (StartDate == "" || StartDate.length == 0 || StartDate == null) {
            StartDateString = "";
        } else {
            StartDateString = "&since=" + formatDate(StartDate);
        }


        // do the same for end date
        var EndDateString;
        if (EndDate == "" || EndDate.length == 0 || EndDate == null) {
            EndDateString = "";
        } else {
            EndDateString = "&until=" + formatDate(EndDate);
        }


        // try to catch error and alert the user about the error they are causing
        try {
            // throw an error when no parameter input
            if (Keyword == "" && Location == "") {
                throw "Please enter something, at least Keyword.";
            }
            // throw an error when the input count is not an integer
            if (isNaN(count) || count % 1 != 0 || (count != null && count < 0)) {
                throw "Please enter a positive integer for the number of result.";
            }
        } catch (err) {
            alert(err);
        }


        // get the page set by the python flask
        $.get("http://127.0.0.1:5000/searching_test/?" + EncodedKeyword + EndDateString + StartDateString + Count + Location,

            function (data, status) {
                // convert Data to JSON Array
                jsObject = JSON.parse(data);

                // the string that transverse js array to html table
                var bodyString = "<table id='myTable' class='tablesorter'>";

                // if there is any result, format them out; otherwise output 'nothing found'
                if (jsObject.length != 0) {

                    // table headers for html
                    bodyString +=
                        "<thead>" +
                        "<tr>" +
                        "<th col width='100'>DATE</th>" +
                        "<th>TEXT</th>" +
                        "<th col width='100'>PLACE</th>" +
                        "<th col width='100'>USER</th>" +
                        "</tr>" +
                        "</thead>" +
                        "<tbody>";

                    // loop through that Array object and add it to result DIV as each table row
                    for (count = 0; count < jsObject.length; count++) {
                        // access those data using ["object name"]["subobject name"]...

                        // change the date from utc to local, display under DATE
                        var UTCTimeString = new Date(jsObject[count].created_at);
                        var localTimeString = UTCTimeString.toLocaleString();

                        // display under TEXT
                        var textString;
                        var tweet = jsObject[count];

                        // getting full text from different forms of tweets
                        // show full text from retweet
                        if (tweet.retweeted_status) {
                            textString = "RT @" + tweet.retweeted_status.full_text;
                        }
                        // show full text from direct tweet
                        else {
                            textString = tweet.full_text;
                        }

                        // to remove duplicate tweet url in the text (if there is)
                        if (tweet.entities.media) {
                            textString = textString.replace(tweet.entities.media[0].url, '');
                        }

                        // convert all the links in the text
                        var finalString = linkify(textString);

                        // add the status url to the final string
                        var tweetUrl = "https://twitter.com/statuses/" + tweet.id_str;
                        finalString += '<br><a href="' + tweetUrl + '" target="_blank">See Full Tweet</a>';

                        // name for the tweet user, with link to its id homepage
                        var userName = jsObject[count].user.name;
                        var userUrl = "http://twitter.com/" + jsObject[count].user.screen_name;
                        var userString = '<a href="' + userUrl + '" target="_blank">' + userName + '</a>';

                        // set to N/A, if there is no place object in the result
                        var locationString = "N/A";
                        if (jsObject[count].place) {
                            locationString = jsObject[count].place.full_name;
                        }

                        // fill in information for each rows 
                        bodyString += "<tr>" +
                            "<td>" + localTimeString + "</td>" +
                            "<td>" + finalString + "</td>" +
                            "<td>" + locationString + "</td>" +
                            "<td>" + userString + "</td>" +
                            "</tr>";
                    }

                    bodyString += "</tbody></table>"; // add the ending html table syntax

                } else {
                    bodyString = "<center>Nothing Found &#x2639</center>"; // sad face, center the line
                }

                $("#result").html(bodyString);

            }
        );

    });

});


// sort the table under different headers after getting all the result and add a theme
$("#myTable").tablesorter({
    theme: 'ice',
    widgets: ['uitheme', 'zebra']
});


// function for downloading the data found
$('#download').click(function () {
    saveJSON(jsObject, "saved_data.json");
});


/* function to save JSON to file from browser
 * adapted from http://bgrins.github.io/devtools-snippets/#console-save
 * @param {Object} data -- json object to save
 * @param {String} file -- file name to save to 
 */
function saveJSON(data, filename) {

    if (!data) {
        alert('No data found! Please start a search first.');
        return;
    }

    if (!filename) filename = 'example.json';

    if (typeof data === "object") {
        data = JSON.stringify(data, undefined, 4);
    }

    var blob = new Blob([data], {
            type: 'text/json'
        }),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
}


// encode the keyword for input symbols in url and fix the unrecognized symbols
function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return "%" + c.charCodeAt(0).toString(16);
    });
}

/* linkify url in the text, 
 * replacing the found url in text with href and keeping other things unchanged
 * when clicked, open the link in another page
 */
function linkify(text) {
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
}


/* formate date obtained from datepicker into what is recognizable in python-twitter program
 * i.e. from mm/dd/yyyy to yyyy-mm-dd
 */
function formatDate(date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
}


// function for toolip display and more help button, which gives instruction
$(function () {
    var tooltips = $("[title]").tooltip({
        position: {
            my: "right top",
            at: "right bottom",
            collision: "none"
        }
    });
    $("<button>")
        .text("Help")
        .button()
        .on("click", function () {
            tooltips.tooltip("open");
        })
        .insertAfter("#help");
});


/* function for autocomplete the user input, from jquery
 * using ajax to find proper source for autocomplete
 */
$("#Keyword").autocomplete({
    source: function (request, response) {

        // create temp varible and call ajax request to get data from python
        var trendWords;
        $.ajax({
            // url is set for US trend, can change to other places if given woe id
            url: "http://127.0.0.1:5000/trend_in_twitter/woe_id=23424977",
            type: "GET",
            dataType: "json",
            data: {
                term: request.term
            },
            success: function (data) {
                trendWords = data; // pass the data from twitter to trendWords

                // function to match the input from the beginning
                var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                response($.grep(trendWords, function (item) {
                    return matcher.test(item);
                }));
            }
        });
    }
});


// checkbox style & effects
$(function () {
    $("#AND_box").checkboxradio({
        icon: false
    });
    $("#OR_box").checkboxradio({
        icon: false
    });
    $("#exact").checkboxradio({
        icon: false
    });
});


// keyup event to disable radiobox and its entry when user deletes keyword
$("#Keyword").keyup(function () {
    if (this.value == "" || this.value.length == 0 || this.value == null) {
        $('input[name="radiobox"]').prop('disabled', true);
        $('input[name="radiobox"]').prop('checked', false);
    } else {
        $('input[name="radiobox"]').prop('disabled', false);
    }
});


// Used to toggle the menu on small screens when clicking on the menu button
function myFunction() {
    var x = document.getElementById("navDemo");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
}