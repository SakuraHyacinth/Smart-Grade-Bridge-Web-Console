from canvasapi import Canvas
from canvasapi.exceptions import InvalidAccessToken
from flask import Flask, Response, stream_with_context
from flask_cors import CORS
from flask import request
from flask import jsonify
from flask import send_file
from instructor import Instructor
import pandas as pd
import copy
import io # This will create a file in RAM instead of on disk

# For debugging
import queue
import json

# refers to prod for now but CHANGE BACK TO TEST ONCE IT IS BACK UP
API_URL = 'https://csusm.instructure.com/'

# For debugging
def push_log(level: str, message: str, data=None):
    entry = {"level": level, "message": message, "data": data}
    log_queue.put(entry)


# Global log queue - all parts of your app push to this
log_queue = queue.Queue()

canvas = None
isAuthenticated = False
instructor = Instructor()

app = Flask(__name__)
CORS(app)

@app.route('/processData', methods=['POST'])
def processData():
    data = request.get_json()

    if canvas is not None and isAuthenticated:
        print('[Received course data]')
        push_log("info", "Received course data", {"status": 200})
        instructor.addCourse(data['title'], int(data['courseId']), int(data['assignmentId']))

        return jsonify({"status": 200})
    else:
        log_queue("error", "Course data not recieved" + {"status": 404})
        return jsonify({"status": 404})

@app.route('/parseABET', methods=['POST'])
def parseABET():
    data = request.get_json()

    if canvas is not None and isAuthenticated:
        df = pd.json_normalize(data['rubric'])

        course = instructor.getCourse(int(data['courseId']))
        assignment = course.getAssignment(int(data['assignmentId']))
        rubric = assignment.getRubric()

        print('[Received ABET rubric]')
        push_log("info", "Recieved ABET rubric")
        convertABET(df, rubric)

        return jsonify({"status": 200})
    else:
        push_log({"status": 404})
        return jsonify({"status": 404})

@app.route('/createRubric', methods=['POST'])
def createRubric():
    data = request.get_json()

    if canvas is not None and isAuthenticated:
        course_info = instructor.getCourse(int(data['courseId']))
        assignment_info = course_info.getAssignment(int(data['assignmentId']))
        rubric_data = assignment_info.getRubric().getRubricData()

        createRubricInCanvas(course_info, assignment_info, rubric_data)
        print('[Rubric created]')
        push_log("success", "Rubric created in Canvas")

        return jsonify({"status": 200})
    else:
        push_log("error", "Rubric creation failed - not authenticated", {"status": 404})
        return jsonify({"status": 404})

@app.route('/exportAssessment', methods=['POST'])
def exportAssessment():
    data = request.get_json()

    if canvas is not None and isAuthenticated:
        course_info = instructor.getCourse(int(data['courseId']))
        assignment_info = course_info.getAssignment(int(data['assignmentId']))
        rubric_info = assignment_info.getRubric()

        print('[Received export request]')
        push_log("info", "Export request recieved")
        response = exportAssessmentFromCanvas(course_info, assignment_info, rubric_info)
        print('[Rubric grades exported]')
        push_log("success", "Rubric grades exported")

        return response, 200
    else:
        push_log("error", "Export failed - not authenticated", {"status": 404})
        return "", 404

@app.route('/uploadCanvasAPIKey', methods=['POST'])
def updateCanvasAPIKey():
    data = request.get_json()

    API_KEY = data['key']
    global canvas
    canvas = Canvas(API_URL, API_KEY)
    global isAuthenticated

    try:
        canvas.get_current_user()
        isAuthenticated = True
        push_log("success", "Canvas API key accepted - authenticated")
        return jsonify({"status": 200})
    except InvalidAccessToken:
        isAuthenticated = False
        push_log("error", "Canvas API key rejected - invalid token")
        return jsonify({"status": 404})

def exportAssessmentFromCanvas(course_info, assignment_info, rubric_info):
    course = canvas.get_course(course_info.getCourseID())
    assignment = course.get_assignment(assignment_info.getAssignmentID())

    # assignment.rubric holds the list of criteria, each with an id and description
    criteria = assignment.rubric

    # rubric_assessment adds per-criterion scores, user adds student info to each submission
    submissions = list(assignment.get_submissions(include=['rubric_assessment', 'user']))

    rows = []
    for submission in submissions:
        # SIS ID is student identifier
        student_id = submission.user.get('sis_user_id', submission.user_id)
        row = {'StudentID': student_id}

        # some submissions may not have a rubric assessment yet, so default to empty dict
        assessment = getattr(submission, 'rubric_assessment', {}) or {}

        # add one column per criterion, handles any number of criteria
        for criterion in criteria:
            criterionID = criterion['id']
            aspect = criterion['description'].split(':')[-1].lstrip()
            row[aspect] = assessment.get(criterionID, {}).get('points', '')

        rows.append(row)
    
    df = pd.DataFrame(rows)

    # build the xlsx file in memory instead of writing to disk
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)

    file_name = rubric_info.getTitle() + ' (Assessment).xlsx'

    response = send_file(
        buffer,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=file_name
    )

    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"

    return response

def createRubricInCanvas(course_info, assignment_info, rubric_data):
    course = canvas.get_course(course_info.getCourseID())
    rubric_dict = course.create_rubric(rubric=rubric_data)
    rubric_id = rubric_dict["rubric"].__getattribute__('id')

    rubric_association_data = {
        'rubric_id': rubric_id,
        'association_type': 'Assignment',
        'association_id': assignment_info.getAssignmentID(),
        'use_for_grading': True,
        'purpose': 'grading'
    }

    course.create_rubric_association(rubric_association=rubric_association_data)

def convertABET(df, rubric):
    title = rubric.getTitle()
    rubric_data = {
        'title': title,
        'criteria': {}
    }
    
    # the first row of the dataframe
    # will contain all of the aspect data
    first_row = list(df.iloc[0])

    # building initial rubric structure
    ratings_dict = {
        'description': None,
        'long_description': None,
        'points': None
    }

    aspect_dict = {
        'description': None,
        'points': None,
        'criterion_use_range': True,
        'ratings': {str(x): copy.deepcopy(ratings_dict) for x in range(1, len(df))}
    }

    rubric_data['criteria'] = {str(y): copy.deepcopy(aspect_dict) for y in range(1, len(first_row))}

    z = 0
    emptyLocated = False
    columns = list(df.columns)
    for j in range(1, len(first_row)):
        emptyLocated = True if '__EMPTY' in columns[j] else False

        if not emptyLocated:
            rubric_data['criteria'][str(j)]['description'] = columns[j] + ': ' + first_row[j]
            z = j
        else:
            rubric_data['criteria'][str(j)]['description'] = columns[z] + ': ' + first_row[j]
    
    items = None
    for i in range(1, len(first_row)):
        for k in reversed(range(1, len(df))):
            items = list(df.iloc[k])

            ratings_description = items[0].split(': ')[-1]
            separated = items[i].split(" ", 1)
            points = separated[0]
            long_description = separated[1]
            
            rubric_data['criteria'][str(i)]['ratings'][str(len(df) - k)]['description'] = ratings_description
            rubric_data['criteria'][str(i)]['ratings'][str(len(df) - k)]['long_description'] = long_description
            rubric_data['criteria'][str(i)]['ratings'][str(len(df) - k)]['points'] = int(points.split('-')[1].strip(']'))

        rubric_data['criteria'][str(i)]['points'] = rubric_data['criteria'][str(i)]['ratings']['1']['points']
    
    rubric.setRubricData(rubric_data)


@app.route("/consoleStream")
def console_stream():
    def generate():
        while True:
            try:
                entry = log_queue.get(timeout=30)
                yield f"data: {json.dumps(entry)}\n\n"
            except queue.Empty:
                yield ": keepalive\n\n"
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
