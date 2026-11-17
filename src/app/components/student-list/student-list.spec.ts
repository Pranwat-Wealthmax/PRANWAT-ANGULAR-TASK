import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudentList } from './student-list';
import { StudentService } from '../../services/student';

describe('StudentList', () => {
  let fixture: ComponentFixture<StudentList>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should show locally saved students when the API request fails', () => {
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

    TestBed.inject(StudentService).addStudent(newStudent).subscribe();
    fixture = TestBed.createComponent(StudentList);
    fixture.detectChanges();

    httpTestingController
      .expectOne('https://dummyjson.com/users?limit=0')
      .error(new ProgressEvent('error'));
    fixture.detectChanges();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.students).toHaveLength(1);
    expect(page.querySelector('tbody')?.textContent).toContain('Alex');
    expect(page.textContent).toContain('Unable to fetch students');
  });
});
