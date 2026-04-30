class Rubric:
    def __init__(self):
        self.title = None
        self.rubricData = None
    
    def setTitle(self, title):
        self.title = title
    
    def getTitle(self):
        return self.title
    
    def setRubricData(self, rubricData):
        self.rubricData = rubricData
    
    def getRubricData(self):
        return self.rubricData
