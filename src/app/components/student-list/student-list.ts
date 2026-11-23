import { RouterLink } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { StudentService } from '../../services/student';
import { Student } from '../../models/student';
import { StudentForm } from '../student-form/student-form';

@Component({
  imports: [RouterLink, StudentForm],
  selector: 'app-student-list',
  styleUrl: './student-list.css',
  templateUrl: './student-list.html',
})
export class StudentList implements OnInit {

  private studentService = inject(StudentService);
  private changeDetector = inject(ChangeDetectorRef);

  students: Student[] = [];

  limit = 10;
  skip = 0;
  total = 0;

  searchQuery = '';
  loading = false;
  errorMessage = '';
  isAddFormOpen = false;

  selectedStudent: Student | null = null;

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.studentService.getStudents(this.limit, this.skip).subscribe({
      next: (response) => {
        this.students = response.users;
        this.total = response.total;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = 'Unable to fetch students. Please try again.';

        this.studentService.getLocalStudents(this.limit, this.skip).subscribe({
          next: (response) => {
            this.students = response.users;
            this.total = response.total;
            this.loading = false;
            this.changeDetector.markForCheck();
          },
          error: (localError) => {
            this.loading = false;
            this.changeDetector.markForCheck();
            console.error(localError);
          }
        });

        this.changeDetector.markForCheck();
        console.error(error);
      }
    });
  }

  onStudentSaved(): void {
    this.isAddFormOpen = false;
    this.loadStudents();
  }

  searchStudents(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();

    this.searchQuery = query;
    this.skip = 0;

    if (!query) {
      this.loadStudents();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.studentService.searchStudents(query).subscribe({
      next: (response) => {
        this.students = response.users;
        this.total = response.total;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = 'Unable to search students. Please try again.';
        this.loading = false;
        this.changeDetector.markForCheck();
        console.error(error);
      }
    });
  }

  viewStudent(student: Student): void {
    this.selectedStudent = student;
    this.changeDetector.markForCheck();
  }

  closeView(): void {
    this.selectedStudent = null;
    this.changeDetector.markForCheck();
  }
  deleteStudent(student: Student): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.firstName} ${student.lastName}?`
    );

    if (!confirmed) {
      return;
    }

    this.loading = true;

    this.studentService.deleteStudent(student.id).subscribe({
      next: () => {
        this.students = this.students.filter(
          item => item.id !== student.id
        );

        this.total = Math.max(0, this.total - 1);

        this.loading = false;

        if (this.students.length === 0 && this.skip > 0 && !this.searchQuery) {
          this.skip = Math.max(0, this.skip - this.limit);
          this.loadStudents();
          return;
        }

        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = 'Unable to delete student. Please try again.';
        this.loading = false;
        this.changeDetector.markForCheck();
        console.error(error);
      }
    });
  }

  nextPage(): void {
    if (this.skip + this.limit >= this.total) {
      return;
    }

    this.skip += this.limit;

    if (this.searchQuery) {
      return;
    }

    this.loadStudents();
  }

  previousPage(): void {
    if (this.skip === 0) {
      return;
    }

    this.skip -= this.limit;

    if (this.searchQuery) {
      return;
    }

    this.loadStudents();
  }

  get currentPage(): number {
    return Math.floor(this.skip / this.limit) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get selectedStudentNumber(): number | null {
    if (!this.selectedStudent) {
      return null;
    }

    const index = this.students.findIndex(
      student => student.id === this.selectedStudent?.id
    );

    return index === -1 ? null : this.skip + index + 1;
  }
}
