"use strict";
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xA0A0AA);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000.0);
camera.position.set(0, 0, 2);
const renderer = new THREE.WebGLRenderer();

const canvas = renderer.domElement;
const width = canvas.clientWidth;
const height = canvas.clientHeight;
renderer.setSize(width, height, false);

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

let orbit_controls = new THREE.OrbitControls(camera, renderer.domElement);
orbit_controls.enablePan = false;
orbit_controls.update();
orbit_controls.addEventListener('change', render);

let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);
let pointLight = new THREE.PointLight(0xFFEEDD, 0.8);
pointLight.position.set(10,10,10);
scene.add(pointLight);



var geometry = new THREE.PlaneGeometry( 1, 1 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.125} );
var materialx = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.125} );
var materialy = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.125} );
var materialz = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.125} );
var plane = new THREE.Mesh( geometry, material );
var planex = new THREE.Mesh( geometry, materialx );
var planey = new THREE.Mesh( geometry, materialy );
var planez = new THREE.Mesh( geometry, materialz );
scene.add( plane );
scene.add( planex );
scene.add( planey );
scene.add( planez );
planex.rotation.x += Math.PI / 2;
planey.rotation.y += Math.PI / 2;
planez.rotation.z += Math.PI / 2;

let graph = graph_from_geometry(import_cg(frame_cg));
let graph_renderer = new Renderer(graph);
graph_renderer.create_edges();
graph_renderer.create_points();
graph_renderer.add_edges(scene);
graph_renderer.add_points(scene);
let key_held = new Array(1024).fill(false);

function onKeyDown(event)
{
	key_held[event.which] = true;
	window.addEventListener( 'keyup', onKeyUp, false );
}
function onKeyUp(event)
{
	console.log(event.which);
	key_held[event.which] = false;
    switch(event.which){
		// case 67:
		// 	break;
        // case 71: // backspace
        //     break;
        default:

            break;
    }
    window.removeEventListener( 'keyup', onKeyUp, false );
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function onMouseUp(event)
{
	window.removeEventListener( 'mousemove', onMouseMove, false );
    window.removeEventListener( 'mouseup', onMouseUp, false );
}


function onMouseMove(event)
{
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	let plane_inter = [];
	if(key_held[88]) 
		plane_inter.push(planex);
	else if(key_held[89]) 
		plane_inter.push(planey);
	else if(key_held[90]) 
		plane_inter.push(planez);
	else 
		plane_inter.push(plane);
	let intersections = raycaster.intersectObjects(plane_inter);

	if(intersections.length)
	{
		// console.log(intersections[0]);
		plane.position.copy(intersections[0].point);
		planex.position.copy(intersections[0].point);
		planey.position.copy(intersections[0].point);
		planez.position.copy(intersections[0].point);

	}
}

function onMouseDown(event)
{
    if(event.buttons == 2)
    {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
        let intersections = raycaster.intersectObjects([mesh_renderer.faces]);

		if(intersections.length)
		{
			console.log(intersections[0]);
			plane.position.copy(intersections[0].point);
			planex.position.copy(intersections[0].point);
			planey.position.copy(intersections[0].point);
			planez.position.copy(intersections[0].point);

			window.addEventListener('mousemove', onMouseMove, false)
			window.addEventListener('mouseup', onMouseUp, false);
		}
	}
}

window.addEventListener( 'mousedown', onMouseDown, false );
window.addEventListener( 'keydown', onKeyDown, false );


function update ()
{
	plane.rotation.copy(camera.rotation);

}

function render()
{
	renderer.render(scene, camera);
}

function loop()
{
    update();
    render();

    requestAnimationFrame(loop);
}

let geo_info = load_off(octahedron_off); // stores the file as an array of vec3 and an array of arrays of vertex indices
let mesh = cmap2_from_geometry(geo_info); // creates the map from the geometric information


let mesh_renderer = new Renderer(mesh);
mesh_renderer.create_points({color: 0x110055});
mesh_renderer.create_edges({color: 0x115500});
mesh_renderer.create_faces();

mesh_renderer.add_points(scene);
mesh_renderer.add_edges(scene);
mesh_renderer.add_faces(scene);

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

loop();
