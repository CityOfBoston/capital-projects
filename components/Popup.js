// We create a number formatter so we can show budgeted amounts
// properly.
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// Depending on the layer the user clicked on, we return different content for
// the popup that is specifc to each dataset.
export default function getPopupHTMl(feature) {
  if (feature.layer.id == 'budgetFacilities') {
    return `<div>                
      <h5 class="text-uppercase">${feature.properties['project_title']}</h5>
          <p class="cd-d">${feature.properties['project_description']}</p>
          <ul class="dl dl--sm">
            <li class="dl-i">
              <span class="dl-d">Status:</span>
              <span class="dl-t">${feature.properties['publish_status']}</span>
            </li>
            <li class="dl-i">
              <span class="dl-d">Total Budget:</span>
              <span class="dl-t">${formatter.format(
                feature.properties['total_budget']
              )}</span>
            </li>
            <li class="dl-i">
              <span class="dl-d">Location:</span>
              <span class="dl-t">${feature.properties['location']}</span>
            </li>
            <li class="dl-i">
              <span class="dl-d">Department:</span>
              <span class="dl-t">${feature.properties['department']}</span>
            </li>
          </ul></div>`;
  } else if (feature.layer.id == 'walkableStreetsSidewalks') {
    return `<div>
        <h5 class="text-uppercase">${feature.properties['DISTRICT']}</h5>
        <p class="cd-d">
          Walkable Streets is a sidewalk improvement program designed to target
          key neighborhood streets and corridors by reconstructing longer,
          contiguous sidewalk sections.
        </p>
      </div>`;
  } else if (feature.layer.id == 'slowStreetsLines') {
    return `<div>
        <h5>${feature.properties['FY20_Proje']}</h5>
        <p class="cd-d">
          The
          <a href="https://www.boston.gov/departments/transportation/neighborhood-slow-streets">
            Neighborhood Slow Streets
          </a>
          program attempts to reduce the number of and severity of crashes on
          residential streets.
        </p>
        <ul class="dl dl--sm">
          <li class="dl-i">
            <span class="dl-d">Project Type:</span>
            <span class="dl-t">${feature.properties['FY20_Type']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">Status:</span>
            <span class="dl-t">${feature.properties['FY20_Statu']}</span>
          </li>
        </ul>
      </div>`;
  } else if (feature.layer.id == 'streetsCapitalProjects') {
    return `<div>
        <h5>${feature.properties['highway']}</h5>
        <p class="cd-d">${feature.properties['Project']}</p>
      </div>`;
  } else if (feature.layer.id == 'arpStreets') {
    return `<div>
        <h5>ARP Street - ${feature.properties['Street']}</h5>
        <ul class="dl dl--sm">
          <li class="dl-i">
            <span class="dl-d">From:</span>
            <span class="dl-t">${feature.properties['From_Stree']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">To:</span>
            <span class="dl-t">${feature.properties['To_Street']}</span>
          </li>
        </ul>
      </div>`;
  } else if (feature.layer.id == 'streetReconstruction') {
    return `<div>
        <h5>Street Reconstruction - ${feature.properties['Street']}</h5>
        <ul class="dl dl--sm">
          <li class="dl-i">
            <span class="dl-d">From:</span>
            <span class="dl-t">${feature.properties['From_']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">To:</span>
            <span class="dl-t">${feature.properties['To_']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">Status:</span>
            <span class="dl-t">${feature.properties['Status']}</span>
          </li>
        </ul>
      </div>`;
  } else if (feature.layer.id == 'southwestCorridor') {
    return `<div>
        <h5>${feature.properties['FY20_Proje']}</h5>
        <ul class="dl dl--sm">
          <li class="dl-i">
            <span class="dl-d">Type:</span>
            <span class="dl-t">${feature.properties['FY20_Type']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">Status:</span>
            <span class="dl-t">${feature.properties['FY20_Statu']}</span>
          </li>
        </ul>
      </div>`;
  } else if (feature.layer.id == 'intersectionReconstruction') {
    return `<div>
        <h5>${feature.properties['Street']} ${feature.properties['From_']}</h5>
        <ul class="dl dl--sm">
          <li class="dl-i">
            <span class="dl-d">Type:</span>
            <span class="dl-t">${feature.properties['Scope']}</span>
          </li>
          <li class="dl-i">
            <span class="dl-d">Status:</span>
            <span class="dl-t">${feature.properties['Status']}</span>
          </li>
        </ul>
      </div>`;
  } else if (feature.layer.id == 'pedestrianRamps') {
    return `<div>
        <h5>
          Pedestrian Ramp - ${feature.properties['LOCATION']}
        </h5>
        <p class="cd-d">
          Every pedestrian ramp the Public Works Department replaces meets
          <a href="https://www.ada.gov/">
            Americans with Disabilities Act standards.
          </a>
        </p>
        <p class="cd-d">
          To replace a ramp, you need to dig out where the old ramp was and
          level the area. The ramp is made by using boards and concrete, and the
          concrete is brushed to create a nonstick surface.
        </p>
      </div>`;
  } else {
    return null;
  }
}
