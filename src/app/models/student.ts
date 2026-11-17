export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: {
    address: string;
    city: string;
    state: string;
  };
}

export interface StudentResponse {
  users: Student[];
  total: number;
  skip: number;
  limit: number;
}