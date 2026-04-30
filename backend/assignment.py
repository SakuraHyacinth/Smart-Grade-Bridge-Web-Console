from rubric import Rubric

class Assignment:
    def __init__(self):
        self.assignment_id = None
        self.rubric = None
    
    def setAssignmentID(self, assignment_id):
        self.assignment_id = assignment_id

    def getAssignmentID(self):
        return self.assignment_id
    
    def addRubric(self, title):
        self.rubric = Rubric()
        self.rubric.setTitle(title)
    
    def getRubric(self):
        return self.rubric
