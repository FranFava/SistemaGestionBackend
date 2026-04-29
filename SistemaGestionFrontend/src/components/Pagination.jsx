const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav>
      <ul className="pagination justify-content-center glass-pagination">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className="page-link glass-page-link" onClick={() => onPageChange(currentPage - 1)}><i className="bi bi-chevron-left"></i> Anterior</button>
        </li>
        {start > 1 && (
          <>
            <li className="page-item"><button className="page-link glass-page-link" onClick={() => onPageChange(1)}>1</button></li>
            {start > 2 && <li className="page-item disabled"><span className="page-link glass-page-link">...</span></li>}
          </>
        )}
        {pages.map(p => (
          <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
            <button className="page-link glass-page-link" onClick={() => onPageChange(p)}>{p}</button>
          </li>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link glass-page-link">...</span></li>}
            <li className="page-item"><button className="page-link glass-page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button></li>
          </>
        )}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button className="page-link glass-page-link" onClick={() => onPageChange(currentPage + 1)}>Siguiente <i className="bi bi-chevron-right"></i></button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;