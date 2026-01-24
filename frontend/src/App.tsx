import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import SmartDropzone from './components/analysis/SmartDropzone';
import VisualBuilder from './components/analysis/VisualBuilder';
import ReportEditor from './components/reports/ReportEditor';

function UploadStep() {
  return (
    <div className="h-full p-8 max-w-7xl mx-auto w-full">
      <div className="max-w-xl mx-auto mt-20">
        <SmartDropzone />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/upload" replace />} />
        <Route path="upload" element={<UploadStep />} />
        <Route path="visualize" element={<VisualBuilder />} />
        <Route path="report" element={<ReportEditor />} />
      </Route>
    </Routes>
  );
}
