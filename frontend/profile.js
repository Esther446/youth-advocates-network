/* ===================================================
   profile.js
   Handles: edit-profile form submission, course list
   Auth & nav are handled by memberDashboard.js
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
    setupEditProfile();
});

/* ---------- EDIT PROFILE ---------- */
function setupEditProfile() {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (typeof api === 'undefined') return;

        const saveBtn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('editProfileError');
        const errorText = document.getElementById('editProfileErrorText');
        const newName = document.getElementById('editName').value;

        if (saveBtn) { saveBtn.textContent = 'Saving...'; saveBtn.disabled = true; }
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            const userData = await api.updateDetails(newName);

            // Update all display fields
            const dispName = document.getElementById('dispName');
            if (dispName) dispName.textContent = userData.name;

            const editName = document.getElementById('editName');
            if (editName) editName.value = userData.name;

            // Close modal
            const modal = document.getElementById('editProfileModal');
            if (modal) modal.classList.remove('active');

        } catch (error) {
            console.error('Profile update failed:', error);
            if (errorText) errorText.textContent = error.message || 'Failed to update profile';
            if (errorDiv) errorDiv.style.display = 'block';
        } finally {
            if (saveBtn) { saveBtn.textContent = 'Save Changes'; saveBtn.disabled = false; }
        }
    });
}
