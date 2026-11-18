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
    const internalId = String(fixture.componentInstance.students[0].id);
    expect(page.querySelector('tbody tr td')?.textContent?.trim()).toBe('1');
    expect(page.querySelector('tbody')?.textContent).not.toContain(internalId);
    expect(page.textContent).toContain('Unable to fetch students');

    page.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('No.1');
    expect(page.textContent).not.toContain(internalId);
  });

  it('should open the add form below the student table', () => {
    fixture = TestBed.createComponent(StudentList);
    fixture.detectChanges();

    httpTestingController
      .expectOne('https://dummyjson.com/users?limit=0')
      .flush({ users: [], total: 0, skip: 0, limit: 0 });
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const addButton = Array.from(page.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Add Student');

    addButton?.click();
    fixture.detectChanges();

    expect(page.querySelector('app-student-form')).toBeTruthy();
    expect(Array.from(page.querySelectorAll('table, app-student-form')).map(element => element.tagName))
      .toEqual(['TABLE', 'APP-STUDENT-FORM']);
  });
});
