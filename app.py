# use flask to render twitter data in a web app via python
# use twitter api to search tweets based on geolocation, time span, and keywords
# i.e. parametric tweet search, source of trend

# import sys  # manually change the library path due to anaconda
# sys.path.append("/Library/Frameworks/Python.framework/Versions/3.7/lib/python3.7/site-packages")

# pip install Flask, python-twitter
import twitter  # from https://pypi.python.org/pypi/python-twitter
from flask import Flask
from flask import render_template
from flask import url_for
from flask import request
import json


# info about the authentication from Steve Hawkes, stored as global constant
CONSUMER_KEY = "NqAkPPmZnlMq2A9pNPWyNjxDV"
CONSUMER_SECRET = "rMqKmr8sYHwiEy7vEAMKReQCflavH78pM1jKPncGu4nIoZf5oV"
ACCESS_TOKEN_KEY = "42687474-fQDGLXWTFS31QDd10h79OyMerqKmbJP3lMMIQAfta"
ACCESS_TOKEN_SECRET = "JIQSbJKITgeLzXBwtHdpnfprlqzG5ZUtvJ9GmAoVzvAJR"

# fill in the authentication code from twitter
api = twitter.Api(
    CONSUMER_KEY,
    CONSUMER_SECRET,
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_SECRET,
    tweet_mode="extended"
)


# parameters used are our interested input, can include more
# there is no limit on the number of result
def parametricTweetSearch(searchingTerm=None, geoCode=None, endingDate=None, startingDate=None, numberOfResult=15):

    searchingResult = api.GetSearch(
        term=searchingTerm,
        geocode=geoCode,
        until=endingDate,
        since=startingDate,
        count=numberOfResult,
        return_json=True
    )["statuses"]  # access the status entity
    # return a list of json result

    # use max_id and since_id to loop through for more tweets
    # the rest in the function is to use loop to get more than 100 tweets
    numberOfResultLeft = int(numberOfResult) - 100

    # if there is still something left to search
    while numberOfResultLeft > 0:

        lastID = searchingResult[-1]["id"] - 1
        # lastID is from the id of the last tweet in searching result
        # it is inclusive (from document), so need to -1 for the next search

        # the next 100 search from twitter api, with the same parameters
        # the count changes to number of result left
        # use max_id obtained in the while loop to filter what is already searched
        remainingResult = api.GetSearch(
            term=searchingTerm,
            geocode=geoCode,
            until=endingDate,
            since=startingDate,
            count=numberOfResultLeft,
            max_id=lastID,
            return_json=True
        )["statuses"]

        # accumulate the searching result, and subtracting number of search left
        searchingResult += remainingResult
        numberOfResultLeft -= 100

    return searchingResult  # in json format


# get the source of current trend in twitter based on WOE id, default is US
# store as a list of 50 entries(strings)
# US_WOE_ID = 23424977 from yahoo! where on earth id
def sourceOfTrend(WOE_ID=23424977):

    trends = api.GetTrendsWoeid(woeid=WOE_ID)
    # if no info is found, get an error

    trend_result = []

    # make the result into a list for easier access of information
    for trend in trends:
        trend_name = trend.name  # access the name in trend obj

        if "#" in trend_name:  # access only hastags

            trend_result.append(trend_name)

    return trend_result
    # 50 entries, even though it says 10 entries in the document


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
    source = sourceOfTrend(woe_id)
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

    result = parametricTweetSearch(
        searching_term,
        geoCode,
        endingDate,
        startingDate,
        numberOfResult)

    return json.dumps(result)  # return json object in a pyhon string


# run the app by running the py program
if __name__ == '__main__':
    app.run(debug=1)
