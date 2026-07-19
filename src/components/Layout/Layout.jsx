import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ title, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header title={title} />
        <main className="page-content page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
