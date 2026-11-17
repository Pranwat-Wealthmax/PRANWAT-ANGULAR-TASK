import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StudentService } from './student';

describe('StudentService', () => {
  let service: StudentService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(StudentService);
    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should include a newly added student in the student list', () => {
    const newStudent = {
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex.rivera@example.com',
      phone: '555-0100',
      age: 20,
      gender: 'other',
      address: {
        address: '1 Main Street',
        city: 'Springfield',
        state: 'CA'
      }
    };

    let addedStudentId: number | undefined;
    service.addStudent(newStudent).subscribe(student => {
      addedStudentId = student.id;
    });

    service.getStudents(10, 0).subscribe(response => {
      expect(response.total).toBe(2);
      expect(response.users[0]).toEqual({ ...newStudent, id: addedStudentId });
    });

    httpTestingController.expectOne('https://dummyjson.com/users?limit=0').flush({
      users: [{
        ...newStudent,
        id: 1
      }],
      total: 1,
      skip: 0,
      limit: 1
    });
  });

  it('should return locally added students without requiring the API', () => {
    const newStudent = {
      firstName: 'Sam',
      lastName: 'Lee',
      email: 'sam.lee@example.com',
      phone: '555-0101',
      age: 21,
      gender: 'other',
      address: {
        address: '2 Main Street',
        city: 'Springfield',
        state: 'CA'
      }
    };

    service.addStudent(newStudent).subscribe();

    service.getLocalStudents(10, 0).subscribe(response => {
      expect(response.total).toBe(1);
      expect(response.users[0]).toMatchObject(newStudent);
    });
  });
});
