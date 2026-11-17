import { RouterLink } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { StudentService } from '../../services/student';
import { Student } from '../../models/student';

@Component({
  imports: [RouterLink],
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

  nextPage(): void {
    if (this.skip + this.limit >= this.total) {
      return;
    }

    this.skip += this.limit;

    if (this.searchQuery) {
      // Search results are handled separately.
      // We'll implement search pagination if needed.
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
}
