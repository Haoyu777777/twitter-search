
# using flask to render twitter date in a web app via python

# pip install Flask


from flask import Flask
from flask import render_template
from flask import request
import parametric_search
import json


app = Flask(__name__)


@app.route("/")  # starting page
def index():
    return render_template('index.html')
    # html template that asks for user input and print output
    # template stored in templates file under the same directory


# return a list of current trending topics in twitter based on WOE id
# meant to help autocomplete when typing keyword
@app.route("/trend_in_twitter/woe_id=<woe_id>")
def trend_in_twitter(woe_id):
    source = parametric_search.sourceOfTrend(woe_id)
    return json.dumps(source)  # json format of python list


# passing multiple parameters in url search
# set the default of geocode to be None, meaningno restriction
# e.g. /term=hello&until=2018-10-7&since=2018-10-3&count=5&geocode=40.71316,-74.00401,1km

@app.route("/searching_test/")
def search_term():

    # set the default parameters in the url address
    searching_term = request.args.get("term", None)
    endingDate = request.args.get("until", None)
    startingDate = request.args.get("since", None)
    numberOfResult = request.args.get("count", 15)
    geoCode = request.args.get("geocode", None)

    # searching term, and count need user typing
    # date come from jqury datepicker
    # geocode can use pining on map; for now it uses checkbox: set to center of charlottesville when checked, the universe when unchecked

    result = parametric_search.parametricTweetSearch(
        searching_term,
        geoCode,
        endingDate,
        startingDate,
        numberOfResult)

    return json.dumps(result)  # return json object in a pyhon string


# run the app by running the py program
if __name__ == '__main__':
    app.run()
