// Let's redirect settings to root since we moved settings to sidebar
import { redirect } from 'next/navigation';

export default function Settings() {
  redirect('/');
}
