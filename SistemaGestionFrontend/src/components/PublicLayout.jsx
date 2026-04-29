import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const PublicLayout = () => {
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <main className="container-fluid py-4 flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
