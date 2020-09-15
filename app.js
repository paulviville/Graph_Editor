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
var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.025} );
var materialx = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.025} );
var materialy = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.025} );
var materialz = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.025} );
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
const position = graph.get_attribute(graph.vertex, "position");
let graph_renderer = new Renderer(graph);
graph_renderer.create_edges();
graph_renderer.create_points();
graph_renderer.add_edges(scene);
graph_renderer.add_points(scene);

let selector = new Selector(graph);
selector.create_points();
scene.add(selector.points);
selector.create_edges();
scene.add(selector.edges);

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
		case 17:
			selected_verts.length = 0;
			break;
		case 67:
			let v0 = position[graph.cell(graph.vertex, selected_edge.dart)];
			let v1 = position[graph.cell(graph.vertex, graph.alpha0[selected_edge.dart])];
			let v = graph.cut_edge(selected_edge.dart);
			position[graph.cell(graph.vertex, v)] = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
			graph_renderer.update_points();
			graph_renderer.update_edges();
			selector.update_points();
			selector.update_edges();
			break;
		case 68:
			if(selected_edge)
				graph.disconnect_vertices(selected_edge.dart, graph.alpha0[selected_edge.dart]);
				selected_edge = null;
				graph_renderer.update_points();
				graph_renderer.update_edges();
				selector.update_edges();
			break;
		case 69:
			// selected_edge = null;
			break;
        // case 71: // backspace
        //     break;
        default:

            break;
    }
    window.removeEventListener( 'keyup', onKeyUp, false );
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();


let selected_point = null;
let selected_edge = null;
let selected_verts = [];
function onMouseUp_point(event)
{
	window.removeEventListener( 'mousemove', onMouseMove_point, false );
    window.removeEventListener( 'mouseup', onMouseUp_point, false );
}


function onMouseMove_point(event)
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
		plane.position.copy(intersections[0].point);
		planex.position.copy(intersections[0].point);
		planey.position.copy(intersections[0].point);
		planez.position.copy(intersections[0].point);
		selected_point.position.copy(intersections[0].point);
		position[graph.cell(graph.vertex, selected_point.dart)].copy(intersections[0].point);
		graph_renderer.update_points_positions();
		graph_renderer.update_edges_positions();
		selector.update_points_positions();
		selector.update_edges_positions();
	}

}


function onMouseDown(event)
{
    if(event.buttons == 2)
    {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
		selected_edge = null;
		selected_point = null;
		raycaster.setFromCamera(mouse, camera);
		if(key_held[17])
		{
			let intersections = raycaster.intersectObjects(selector.points.children);
			if(intersections.length)
			{
				selected_verts.push(intersections[0].object.dart);
				console.log(selected_verts);
				if(selected_verts.length == 2)
				{
					graph.connect_vertices(selected_verts[0], selected_verts[1]);
					graph_renderer.update_edges();
					graph_renderer.update_points();
					selector.update_edges();
					selected_verts = [selected_verts[1]];
				}
				
			}
		}
		else if(key_held[68])
		{
			let intersections = raycaster.intersectObjects(selector.points.children);
			if(intersections.length)
			{
				let vd = intersections[0].object.dart;
				graph.delete_vertex(vd);
				graph_renderer.update_edges();
				graph_renderer.update_points();
				selector.update_points();
				selector.update_edges();
				
			}
		}
		else {
			if(!key_held[69])
			{			
				let intersections = raycaster.intersectObjects(selector.points.children);
				console.log(intersections);
				console.log(selector.points.children);
				if(intersections.length)
				{
					console.log(intersections[0].object.dart);
					plane.position.copy(intersections[0].point);
					planex.position.copy(intersections[0].point);
					planey.position.copy(intersections[0].point);
					planez.position.copy(intersections[0].point);

					selected_point = intersections[0].object;
					selected_edge = null;

					window.addEventListener('mousemove', onMouseMove_point, false)
					window.addEventListener('mouseup', onMouseUp_point, false);
				}
			}
			else
			{
				let intersections = raycaster.intersectObjects(selector.edges.children);
				if(intersections.length)
				{
					console.log(intersections[0].object.dart);
					plane.position.copy(intersections[0].point);
					planex.position.copy(intersections[0].point);
					planey.position.copy(intersections[0].point);
					planez.position.copy(intersections[0].point);

					selected_edge = intersections[0].object;
					selected_point = null;
				}
			}
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

// let geo_info = load_off(octahedron_off); // stores the file as an array of vec3 and an array of arrays of vertex indices
// let mesh = cmap2_from_geometry(geo_info); // creates the map from the geometric information


// let mesh_renderer = new Renderer(mesh);
// mesh_renderer.create_points({color: 0x110055});
// mesh_renderer.create_edges({color: 0x115500});
// mesh_renderer.create_faces();

// let i = 0;
// graph.foreach(graph.edge, ed => {
// 	i++;
// });
// console.log(i);
// mesh_renderer.add_points(scene);
// mesh_renderer.add_edges(scene);
// mesh_renderer.add_faces(scene);

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

loop();
