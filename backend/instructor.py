from course import Course

class Instructor:
    def __init__(self):
        self.courses = {}
    
    def addCourse(self, title, course_id, assignment_id):
        if course_id not in self.courses:
            self.courses[course_id] = Course()
            self.courses[course_id].setCourseID(course_id)
        
        self.courses[course_id].addAssignment(assignment_id, title)
    
    def getCourse(self, course_id):
        return self.courses[course_id]
    
    def getCourses(self):
        return self.courses
