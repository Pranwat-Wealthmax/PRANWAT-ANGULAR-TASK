
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student';
import { Student } from '../../models/student';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-student-form',
  styleUrl: './student-form.css',
  templateUrl: './student-form.html',
})
export class StudentForm implements OnInit {

  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  studentId: number | null = null;
  isEditMode = false;
  loading = false;
  errorMessage = '';

  studentForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(1)]],
    gender: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.studentId = Number(id);
      this.isEditMode = true;
      this.loadStudent(this.studentId);
    }
  }

  loadStudent(id: number): void {
    this.loading = true;

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.studentForm.patchValue({
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          age: student.age,
          gender: student.gender,
          address: student.address?.address ?? '',
          city: student.address?.city ?? '',
          state: student.address?.state ?? ''
        });

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Unable to load student details.';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const formValue = this.studentForm.getRawValue();

    const studentData: Omit<Student, 'id'> = {
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      email: formValue.email!,
      phone: formValue.phone!,
      age: formValue.age!,
      gender: formValue.gender!,
      address: {
        address: formValue.address!,
        city: formValue.city!,
        state: formValue.state!
      }
    };

    this.loading = true;
    this.errorMessage = '';

    const request = this.isEditMode
      ? this.studentService.updateStudent(this.studentId!, studentData)
      : this.studentService.addStudent(studentData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = 'Unable to save student. Please try again.';
        this.loading = false;
        console.error(error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
