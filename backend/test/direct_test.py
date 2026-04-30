import requests
import json

API_URL = "https://csusm.test.instructure.com"
API_KEY = "19556~wCWnFJ3kvfAF9hF94h3RT6VRK8C3manrzvyKw3xDT4BAAXN7t222fw97PAk3yNQB".strip() # had to strip as it was giving invalid access token

COURSE_ID = 49545
ASSIGNMENT_ID = 817826


# Headers sent with our request, tells canvas who we are and what we want back
# Authorization headers is our most important part, it tells canvas who we are and gives us access to the API
#Accept: tells us we want JSON back, earlier received html back
# User agent identifies client making request, prevents request from being blocked by canvas security measures
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json",
    "User-Agent": "python-requests"
}
# These are the api endpoints we are reaching out to, create_url is for creating a rubric, list_url is for listing all rubrics in the course
create_url = f"{API_URL}/api/v1/courses/{COURSE_ID}/rubrics"
list_url = f"{API_URL}/api/v1/courses/{COURSE_ID}/rubrics"
# our rubric criterian that displays
data = {
    "rubric[title]": "Direct API Test Rubric",
    "rubric[free_form_criterion_comments]": "1",
    "rubric[criteria][0][description]": "Clarity",
    "rubric[criteria][0][long_description]": "Work is clear and understandable",
    "rubric[criteria][0][points]": "5",
    "rubric[criteria][0][criterion_use_range]": "0",
    "rubric[criteria][0][ratings][0][description]": "Excellent",
    "rubric[criteria][0][ratings][0][points]": "5",
    "rubric[criteria][0][ratings][1][description]": "Satisfactory",
    "rubric[criteria][0][ratings][1][points]": "3",
    "rubric[criteria][0][ratings][2][description]": "Poor",
    "rubric[criteria][0][ratings][2][points]": "1",

    "rubric_association[association_id]": str(ASSIGNMENT_ID),
    "rubric_association[association_type]": "Assignment",
    "rubric_association[use_for_grading]": "1",
    "rubric_association[purpose]": "grading"

}

# Our api call, request.post (Send HTTP Post request to rubric endpoint), create_url (endpoint we are sending to), headers (our headers with auth and accept), data (our rubric data)
# r is our response object, the status code indicates success/failure, json is rubric data Canvas built, and text is our raw response helps with debugging
# Response codes: 200 is success, 201 created, 400 bad tokenm, 422 invalid, 500 is a server issue
# json.dumps formats our json response to be more readable, indent=2 adds spacing for readability
r = requests.post(create_url, headers=headers, data=data)

print("STATUS:", r.status_code)
print(json.dumps(r.json(), indent=2))

