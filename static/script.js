document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu-item');
    let selectedIndex = 0;
    const originalTexts = Array.from(menuItems).map(item => item.textContent);

    function updateSelection() {
        menuItems.forEach((item, index) => {
            item.textContent = (index === selectedIndex ? '> ' : '') + originalTexts[index];
        });
    }

    updateSelection();

    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % menuItems.length;
            updateSelection();
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
            updateSelection();
            event.preventDefault();
        } else if (event.key === 'Enter') {
            const selectedItem = menuItems[selectedIndex];
            const command = selectedItem.getAttribute('data-command');
            runCommand(command);
            event.preventDefault();
        }
    });

    function runCommand(command) {
        if (command === 'ai') {
            window.location.href = '/ai_assistant';
        } else {
            window.location.href = '/output?command=' + encodeURIComponent(command);
        }
    }
});