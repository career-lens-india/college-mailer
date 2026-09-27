import "react";

declare module "react" {
  interface TdHTMLAttributes<T> {
    bgcolor?: string;
  }

  interface TableHTMLAttributes<T> {
    bgcolor?: string;
  }
}
