from assignment import Assignment

class Course:
    def __init__(self):
        self.course_id = None
        self.assignments = {}
    
    def setCourseID(self, course_id):
        self.course_id = course_id
    
    def getCourseID(self):
        return self.course_id
    
    def addAssignment(self, assignment_id, title):
        if assignment_id not in self.assignments:
            self.assignments[assignment_id] = Assignment()
            self.assignments[assignment_id].setAssignmentID(assignment_id)
        
        self.assignments[assignment_id].addRubric(title)
    
    def getAssignment(self, assignment_id):
        return self.assignments[assignment_id]
    
    def getAssignments(self):
        return self.assignments
