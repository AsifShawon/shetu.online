
// ______________________ multiple country selection on filter start
const selectedItems = {
  course: [],
  level: [],
  country: [],

  level_scholar: [],
  country_scholar: [],

  country_university: [],
  country_scholar: [],

  country_budget: [],
};

function updateHiddenInputs() {
  const selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};

  document.getElementById("courseInput").value = (selectedItems.course || []).join(',');
  document.getElementById("levelInput").value = (selectedItems.level || []).join(',');
  document.getElementById("countryInput").value = (selectedItems.country || []).join(',');

  document.getElementById("schollar_levelInput").value = (selectedItems.level_scholar || []).join(',');
  document.getElementById("schollar_countryInput").value = (selectedItems.country_scholar || []).join(',');

  document.getElementById("universities_universityInput").value = (selectedItems.university || []).join(',');
  document.getElementById("universities_countryInput").value = (selectedItems.country_university || []).join(',');

  document.getElementById("budget_country").value = (selectedItems.country_budget || []).join(',');
}


function toggleDropdown(type) {
    const dropdown = document.getElementById(`dropdown-${type}`);
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }
  
    function filterDropdown(type) {
      console.log('keyup text');
      console.log(type);
      // const input = document.querySelector(`#dropdown-${type} input`);
      const input = document.querySelector(`#dropbtnInput-${type} input`);
      const filter = input.value.toUpperCase();
      const items = document.querySelectorAll(`#dropdown-${type} p`);
    
      items.forEach(item => {
          const text = item.textContent || item.innerText;
          item.style.display = text.toUpperCase().includes(filter) ? "" : "none";
      });
    }
  
  function selectItem(el, type) {
      //  console.log(type);
    el.classList.toggle("selected");
    updateSelectedList(type); // this looks like it's used for display purposes
  
    const value = el.textContent.trim();
  
    if (!selectedItems[type]) {
      selectedItems[type] = [];
    }
  
    if (el.classList.contains("selected")) {
      // Add if not already in array
      if (!selectedItems[type].includes(value)) {
        selectedItems[type].push(value);
      }
    } else {
      // Remove from array
      selectedItems[type] = selectedItems[type].filter(item => item !== value);
    }
  
    localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
    updateHiddenInputs(); 
    console.log(selectedItems);
  }
  
  function updateSelectedList(type) {
    const selectedElements = document.querySelectorAll(`#dropdown-${type} p.selected`);
    const selectedValues = Array.from(selectedElements).map(el => el.textContent);
    const displayBox = document.getElementById(`selected${capitalize(type)}`);

    // Update global object
    selectedItems[type] = selectedValues;

    // Save to localStorage
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));

    // Update hidden inputs
    updateHiddenInputs();

    displayBox.innerHTML = ""; // Clear old items
if (selectedValues.length > 0) {
    selectedValues.forEach(value => {
        const span = document.createElement("span");
        span.className = "tag-span";

        // Create text node
        const text = document.createElement("span");
        text.textContent = value;
        text.style.marginRight = "8px";

        // Create cross icon
        const closeIcon = document.createElement("span");
        closeIcon.innerHTML = "&times;";
        closeIcon.style.cursor = "pointer";
        closeIcon.style.marginLeft = "0px";
        // closeIcon.style.fontWeight = "bold";
        closeIcon.style.fontSize = "15px";
        closeIcon.style.color = "white";

            const inputs = document.querySelectorAll('#input_field');
    inputs.forEach(input => input.value = '');


        // Handle click on the cross icon
        closeIcon.onclick = function (e) {
            e.stopPropagation(); // Prevent triggering span click if needed

            // Unselect from dropdown
            document.querySelectorAll(`#dropdown-${type} p`).forEach(p => {
                if (p.textContent === value) p.classList.remove("selected");
            });

            // Remove from selectedItems and update localStorage
            const index = selectedItems[type].indexOf(value);
            if (index !== -1) {
                selectedItems[type].splice(index, 1);
                localStorage.setItem('selectedItems', JSON.stringify(selectedItems));

                // Update hidden inputs again after removal
                updateHiddenInputs();
            }

            // Refresh tags
            updateSelectedList(type);
        };

        // Assemble the tag
        span.appendChild(text);
        span.appendChild(closeIcon);
        displayBox.appendChild(span);
      });
    } else {
      // displayBox.textContent = `Select ${capitalize(type)}`;
}

}



  
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Close all dropdowns if clicked outside
  document.addEventListener("click", function (event) {
    const clickedDropdown = event.target.closest(".dropdown");

    document.querySelectorAll(".dropdown").forEach(dropdown => {
      const dropdownContent = dropdown.querySelector(".dropdown-content");

      if (!clickedDropdown || dropdown !== clickedDropdown) {
        // If no dropdown was clicked, or it's a different one — hide
        dropdownContent.style.display = "none";
        console.log("Hiding:", dropdown.getAttribute("data-type"));
      }
    });

    // Optional: if clickedDropdown exists, show its content
    if (clickedDropdown) {
      const content = clickedDropdown.querySelector(".dropdown-content");
      content.style.display = "block";
      console.log("Showing:", clickedDropdown.getAttribute("data-type"));
    }
  });


  window.addEventListener("DOMContentLoaded", function () {
    updateHiddenInputs();
  });

  // ______________________ multiple country selection on filter end
  
  
  