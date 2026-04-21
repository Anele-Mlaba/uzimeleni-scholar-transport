// ============================================================
// FLAGS / COMPLIANCE — Uzimeleni Scholar Transport System
// ============================================================

async function renderFlags() {
  showLoading('flags-content');
  await Promise.all([refreshOwners(), refreshMeetings(), refreshPayments()]);

  const flaggedList = getFlags();

  document.getElementById('flags-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Flags / Compliance</h5>
      <span class="badge ${flaggedList.length > 0 ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2">
        <i class="bi bi-flag-fill me-1"></i>${flaggedList.length} Flagged
      </span>
    </div>

    <div class="alert alert-info border-0 shadow-sm mb-4 d-flex gap-3">
      <i class="bi bi-info-circle-fill fs-5 flex-shrink-0 mt-1"></i>
      <div>
        <strong>Auto-flagging Rules</strong><br>
        <span class="small">Members are flagged automatically when they:</span>
        <ul class="small mb-0 mt-1">
          <li>Are absent from <strong>3 or more</strong> meetings</li>
          <li>Have <strong>any unpaid</strong> association fee payments</li>
        </ul>
      </div>
    </div>

    ${flaggedList.length === 0
      ? `<div class="card border-0 shadow-sm">
           <div class="card-body text-center py-5">
             <i class="bi bi-shield-check text-success" style="font-size:3rem"></i>
             <h5 class="mt-3 text-success">All Clear!</h5>
             <p class="text-muted mb-0">No compliance issues found. All members are in good standing.</p>
           </div>
         </div>`
      : flaggedList.map(f => {
          const unpaidAmt = payments
            .filter(p => p.ownerId === f.owner.id && p.status === 'pending')
            .reduce((s, p) => s + p.amount, 0);
          const absentCount = getMeetings().reduce((count, m) => {
            return count + ((m.absentees || []).some(a => a.idNumber === f.owner.idNumber) ? 1 : 0);
          }, 0);

          return `
            <div class="card border-0 shadow-sm mb-3 border-start border-danger border-4">
              <div class="card-body">
                <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div class="d-flex gap-3">
                    <div class="rounded-circle bg-danger-subtle text-danger d-flex align-items-center
                                justify-content-center flex-shrink-0"
                         style="width:48px;height:48px;font-size:1.2rem">
                      <i class="bi bi-person-x-fill"></i>
                    </div>
                    <div>
                      <div class="fw-semibold fs-6">${escapeHtml(f.owner.name)} ${escapeHtml(f.owner.surname)}</div>
                      <div class="text-muted small">${escapeHtml(f.owner.idNumber)} &bull; ${escapeHtml(f.owner.phone)}</div>
                      <div class="mt-2">
                        ${f.reasons.map(r => `
                          <div class="d-flex align-items-center text-danger small mb-1">
                            <i class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0"></i>
                            <span>${escapeHtml(r)}</span>
                          </div>`).join('')}
                      </div>
                    </div>
                  </div>
                  <div class="d-flex flex-md-column gap-2 align-items-start align-items-md-end">
                    <span class="badge bg-danger fs-6 px-3 py-2">Flagged</span>
                    <div class="text-end d-none d-md-block">
                      ${absentCount >= 3 ? `<div class="small text-muted">${absentCount}/${meetings.length} meetings missed</div>` : ''}
                      ${unpaidAmt > 0 ? `<div class="small text-muted">${formatCurrency(unpaidAmt)} outstanding</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('')
    }
  `;
}
