// navbar stuff
const navbar = document.getElementById("navbar");
const navbarItems = document.getElementById("navbar-items");
const navbarToggle = document.getElementById("navbar-toggle");
navbarToggle.addEventListener("click", () => {
  navbar.classList.toggle("active");
});

// actually interesting stuff
const sectionSpace = 2000;
const sections = [...document.querySelectorAll("#sections > section")];

document.body.style.height = sections.length * sectionSpace + 2000 + "px";
sections.forEach((section, index) => {
  // create spacer
  const spacer = document.createElement("div");

  // calculate the spacer's height
  let height = sectionSpace;
  if (index === sections.length - 1) height = height + 2000;
  const halfHeight = Math.floor(height / 2);

  // set height and margin and append to body
  spacer.style.height = halfHeight + "px";
  spacer.style.marginTop = halfHeight + "px";
  document.body.appendChild(spacer);

  // append section link to navigation
  const navLink = document.createElement("div");
  navLink.innerText = section.getAttribute("name");
  navLink.style.setProperty(
    "--shadow-color",
    `#${section.getAttribute("color")}`
  );
  navLink.onclick = () => {
    if (index === 0) window.scrollTo(0, 0);
    else spacer.scrollIntoView();
    navbar.classList.remove("active");
  };
  navbarItems.appendChild(navLink);
});

function update() {
  const offset = window.scrollY;
  const indexPercentage = offset / sectionSpace;
  const index = Math.min(sections.length - 1, Math.floor(indexPercentage));
  const percentage = indexPercentage - index;

  function updateBodyColor() {
    const newColorString = sections[index].getAttribute("color");
    const newCol1 = parseInt(newColorString.slice(0, 2), 16);
    const newCol2 = parseInt(newColorString.slice(2, 4), 16);
    const newCol3 = parseInt(newColorString.slice(4, 6), 16);

    const prevColorString = index
      ? sections[index - 1].getAttribute("color")
      : "303030";
    const prevCol1 = parseInt(prevColorString.slice(0, 2), 16);
    const prevCol2 = parseInt(prevColorString.slice(2, 4), 16);
    const prevCol3 = parseInt(prevColorString.slice(4, 6), 16);

    const col1 = Math.min(
      255,
      Math.floor(newCol1 * percentage) + Math.floor(prevCol1 * (1 - percentage))
    );
    const col2 = Math.min(
      255,
      Math.floor(newCol2 * percentage) + Math.floor(prevCol2 * (1 - percentage))
    );
    const col3 = Math.min(
      255,
      Math.floor(newCol3 * percentage) + Math.floor(prevCol3 * (1 - percentage))
    );

    function hexString(value) {
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    const hex = hexString(col1) + hexString(col2) + hexString(col3);
    window.currentColor = parseInt(hex, 16);

    const color = "#" + hex;
    document.getElementById("threebg").style.backgroundColor = color;
  }

  function updateSectionPositions() {
    sections.forEach((section, index) => {
      // 10⁻²⁶ * (x - (1000 + i * 2000))⁹
      function calcOffset(x) {
        if (x < 0.5 * sectionSpace) x = 0.5 * sectionSpace;
        else if (x > (sections.length - 0.5) * sectionSpace)
          x = (sections.length - 0.5) * sectionSpace;

        return Math.pow(10, -26) * Math.pow(x - (1000 + index * 2000), 9);
      }

      function extraOffset() {
        const rect = section.getBoundingClientRect();
        return (window.innerHeight - rect.height) / 3;
      }

      let sectionOffset = calcOffset(offset);
      section.setAttribute("offset", (sectionOffset * 1000).toString());

      // add extra offset after setting the attribute to not mess up
      // the animation where the objects float out of the screen
      sectionOffset = sectionOffset * window.innerHeight + extraOffset();
      section.style.top = sectionOffset + "px";
    });

    const offsets = [...sections].map((e) =>
      Math.abs(parseFloat(e.getAttribute("offset")))
    );
    window.spacing = Math.abs(Math.min(...offsets) / 1000) + 0.2;
  }

  updateBodyColor();
  updateSectionPositions();
}

window.addEventListener("scroll", update);
window.addEventListener("resize", update);

update();
