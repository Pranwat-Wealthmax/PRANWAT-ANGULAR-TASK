
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Student, StudentResponse } from '../models/student';

interface LocalStudentData {
  added: Student[];
  updated: Student[];
  deletedIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private http = inject(HttpClient);
  private apiUrl = 'https://dummyjson.com/users';
  private storageKey = 'student-management-data';

  // Read locally saved changes
  private getLocalData(): LocalStudentData {
    const data = localStorage.getItem(this.storageKey);

    const localData: LocalStudentData = data
      ? JSON.parse(data)
      : { added: [], updated: [], deletedIds: [] };

    let changed = false;

    // Ensure locally added students have unique IDs
    localData.added = localData.added.map((student, index) => {
      if (student.id < 1000000000000) {
        changed = true;

        return {
          ...student,
          id: Date.now() + index
        };
      }

      return student;
    });

    if (changed) {
      this.saveLocalData(localData);
    }

    return localData;
  }

  // Save locally changed data
  private saveLocalData(data: LocalStudentData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Combine API students with local changes
  private mergeStudents(apiStudents: Student[]): Student[] {
    const localData = this.getLocalData();

    // Apply updated student data
    let students = apiStudents.map(student => {
      const updatedStudent = localData.updated.find(
        item => item.id === student.id
      );

      return updatedStudent || student;
    });

    // Remove deleted students
    students = students.filter(
      student => !localData.deletedIds.includes(student.id)
    );

    // Add locally saved students at the beginning
    students = [...localData.added].reverse().concat(students);

    return students;
  }

  // Get all students and apply local changes
  private getAllStudents(): Observable<Student[]> {
    return this.http.get<StudentResponse>(
      `${this.apiUrl}?limit=0`
    ).pipe(
      map(response => this.mergeStudents(response.users))
    );
  }

  // Get students with pagination
  getStudents(limit: number, skip: number): Observable<StudentResponse> {
    return this.getAllStudents().pipe(
      map(students => {
        return {
          users: students.slice(skip, skip + limit),
          total: students.length,
          skip: skip,
          limit: limit
        };
      })
    );
  }

  // Get locally added students when the remote list is unavailable
  getLocalStudents(limit: number, skip: number): Observable<StudentResponse> {
    const students = [...this.getLocalData().added].reverse();

    return of({
      users: students.slice(skip, skip + limit),
      total: students.length,
      skip,
      limit
    });
  }

  // Search students by name
  searchStudents(query: string): Observable<StudentResponse> {
    return this.getAllStudents().pipe(
      map(students => {
        const filteredStudents = students.filter(student =>
          `${student.firstName} ${student.lastName}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );

        return {
          users: filteredStudents,
          total: filteredStudents.length,
          skip: 0,
          limit: filteredStudents.length
        };
      })
    );
  }

  // Get one student by ID
  getStudentById(id: number): Observable<Student> {
    return this.getAllStudents().pipe(
      map(students => {
        const student = students.find(item => item.id === id);

        if (!student) {
          throw new Error('Student not found');
        }

        return student;
      })
    );
  }

  // Add student
  addStudent(student: Omit<Student, 'id'>): Observable<Student> {
    const data = this.getLocalData();

    // Generate a unique local ID
    let newId = Date.now();

    while (
      data.added.some(item => item.id === newId) ||
      data.updated.some(item => item.id === newId)
    ) {
      newId++;
    }

    const newStudent: Student = {
      ...student,
      id: newId
    };

    data.added.push(newStudent);
    this.saveLocalData(data);

    return of(newStudent);
  }

  // Update student
  updateStudent(
    id: number,
    student: Omit<Student, 'id'>
  ): Observable<Student> {
    return this.http.put<Student>(
      `${this.apiUrl}/${id}`,
      student
    ).pipe(
      map(() => {
        const updatedStudent: Student = {
          ...student,
          id
        };

        const data = this.getLocalData();

        // Check whether this is a locally added student
        const addedIndex = data.added.findIndex(
          item => item.id === id
        );

        if (addedIndex !== -1) {
          data.added[addedIndex] = updatedStudent;
        } else {
          const updatedIndex = data.updated.findIndex(
            item => item.id === id
          );

          if (updatedIndex !== -1) {
            data.updated[updatedIndex] = updatedStudent;
          } else {
            data.updated.push(updatedStudent);
          }
        }

        this.saveLocalData(data);

        return updatedStudent;
      })
    );
  }

  // Delete student
  deleteStudent(id: number): Observable<Student> {
    return this.http.delete<Student>(
      `${this.apiUrl}/${id}`
    ).pipe(
      map(response => {
        const data = this.getLocalData();

        // Remove from locally added and updated students
        data.added = data.added.filter(
          item => item.id !== id
        );

        data.updated = data.updated.filter(
          item => item.id !== id
        );

        // Mark API student as deleted
        if (!data.deletedIds.includes(id)) {
          data.deletedIds.push(id);
        }

        this.saveLocalData(data);

        return response;
      })
    );
  }
}
