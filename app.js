"use strict";
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xA0A0AA);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000.0);
camera.position.set(0, 0, 2);
const renderer = new THREE.WebGLRenderer();

const canvas = renderer.domElement;
const width = canvas.clientWidth;
const height = canvas.clientHeight;
renderer.setSize(width, height, false);

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

// let orbit_controls = new THREE.OrbitControls(camera, renderer.domElement);
// orbit_controls.enablePan = false;
// orbit_controls.update();
// orbit_controls.addEventListener('change', render);

let trackballcontrols = new THREE.TrackballControls(camera, renderer.domElement);
trackballcontrols.addEventListener('change', render);
trackballcontrols.rotateSpeed =2.0;
trackballcontrols.zoomSpeed = 1.2;
trackballcontrols.panSpeed = 0.8;
trackballcontrols.noPan = true;
trackballcontrols.target.set(0, 0, 0);
console.log(trackballcontrols);



let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);
let pointLight = new THREE.PointLight(0xFFEEDD, 0.8);
pointLight.position.set(10,10,10);
scene.add(pointLight);



var geometry = new THREE.PlaneGeometry( 10, 10 );
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
plane.material.visible = false;
planex.material.visible = false;
planey.material.visible = false;
planez.material.visible = false;


/// frame
var geom = new THREE.PlaneGeometry( 0.1, 0.1 );
var mat_x = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.05} );
var mat_y = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.05} );
var mat_z = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.05} );
var pl_x = new THREE.Mesh( geom, mat_x );
var pl_y = new THREE.Mesh( geom, mat_y );
var pl_z = new THREE.Mesh( geom, mat_z );
scene.add( pl_x );
scene.add( pl_y );
scene.add( pl_z );
pl_x.rotation.x += Math.PI / 2;
pl_y.rotation.y += Math.PI / 2;
pl_z.rotation.z += Math.PI / 2;


let graph = graph_from_geometry(import_cg(frame_cg));
let position = graph.get_attribute(graph.vertex, "position");
let graph_renderer = new Renderer(graph);
graph_renderer.create_edges();
graph_renderer.create_points();
graph_renderer.add_edges(scene);
graph_renderer.add_points(scene);

let selector = new Selector(graph);

let el0 = get_average_edge(graph);
selector.create_points({size: el0 / 5});
scene.add(selector.points);
scene.add(selector.point_highlighter);
selector.create_edges({size: el0 / 5});
scene.add(selector.edges);
scene.add(selector.edge_highlighter);
selector.modify_highlighters(el0 / 5);
let key_held = new Array(1024).fill(false);
function onKeyDown(event)
{
	key_held[event.which] = true;
	window.addEventListener( 'keyup', onKeyUp, false );
	if(event.which == 65)
	{
		plane.position.copy(bb_mid);
		planex.position.copy(bb_mid);
		planey.position.copy(bb_mid);
		planez.position.copy(bb_mid);
		// window.addEventListener( 'mousemove', onMouseMove_point_add, false );
	}
}
function onKeyUp(event)
{
	console.log("keyUp: ", event.which);
	key_held[event.which] = false;
    switch(event.which){
		case 17:
			selected_verts.length = 0;
			selector.unhighlight_point();
			break;
		case 65:
			// window.removeEventListener( 'mousemove', onMouseMove_point_add, false );
			break;
		case 67:
			if(selected_edge)
			{
				let v0 = position[graph.cell(graph.vertex, selected_edge.dart)];
				let v1 = position[graph.cell(graph.vertex, graph.alpha0[selected_edge.dart])];
				let v = graph.cut_edge(selected_edge.dart);
				position[graph.cell(graph.vertex, v)] = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
				graph_renderer.update_points();
				graph_renderer.update_edges();
				// selector.update_points();
				selector.delete_points();
				selector.create_points();
				selector.add_points(scene);
				selector.update_edges();
				selected_edge = null;
				selector.unhighlight_edge();
			}
			break;
		case 68:
			if(selected_edge)
			{
				graph.disconnect_vertices(selected_edge.dart, graph.alpha0[selected_edge.dart]);
				selected_edge = null;
				graph_renderer.update_points();
				graph_renderer.update_edges();
				selector.update_edges();
				selector.delete_points();
				selector.create_points();
				selector.add_points(scene);
				selector.unhighlight_edge();
			}
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
		// selected_point.position.copy(intersections[0].point);
		// selected_point.position.copy(intersections[0].point);
		position[graph.cell(graph.vertex, selected_point)].copy(intersections[0].point);
		// position[graph.cell(graph.vertex, selected_point.dart)].copy(intersections[0].point);
		graph_renderer.update_points_positions();
		graph_renderer.update_edges_positions();
		selector.update_points_positions();
		selector.update_edges_positions();
		selector.highlight_point_update();
	}
}

function onMouseUp_point_add(event)
{
	window.removeEventListener( 'mousemove', onMouseMove_point_add, false );
    window.removeEventListener( 'mouseup', onMouseUp_point_add, false );
}


function onMouseMove_point_add(event)
{
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	let plane_inter = [];
	plane_inter.push(planex);
	plane_inter.push(planey);
	plane_inter.push(planez);
	plane_inter.push(plane);
	let intersections = raycaster.intersectObjects(plane_inter);

	if(intersections.length)
	{
		// plane.position.copy(intersections[0].point);
		// planex.position.copy(intersections[0].point);
		// planey.position.copy(intersections[0].point);
		// planez.position.copy(intersections[0].point);
		// selected_point.position.copy(intersections[0].point);
		// position[graph.cell(graph.vertex, selected_point.dart)].copy(intersections[0].point);
		// graph_renderer.update_points_positions();
		// graph_renderer.update_edges_positions();
		// selector.update_points_positions();
		// selector.update_edges_positions();
		selector.highlight_point_update();
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
				selector.highlight_point(intersections[0].object.dart);
				selector.unhighlight_edge();
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
		else if(key_held[65])
		{
			let plane_inter = [];
			plane_inter.push(plane);
			let intersections = raycaster.intersectObjects(plane_inter);
			if(intersections.length)
			{
				let vd = graph.add_vertex(true);
				position[graph.cell(graph.vertex, vd)] = intersections[0].point.clone();
				graph_renderer.update_points();
				selector.update_points();
				selector.update_edges();
				
			}
		}
		else if(key_held[77])
		{
			let intersections = raycaster.intersectObjects(selector.points.children);
			if(intersections.length)
			{
				let vd = intersections[0].object.dart;
				graph.merge_edges(vd);
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
				if(intersections.length)
				{
					let vd = intersections[0].object.dart;
					let p = position[graph.cell(graph.vertex, vd)];
					plane.position.copy(p);
					planex.position.copy(p);
					planey.position.copy(p);
					planez.position.copy(p);

					if(key_held[81])
					{
						let vd0 = graph.add_vertex(true);
						let vd1 = intersections[0].object.dart;
						graph.connect_vertices(vd0, vd1);
						position[graph.cell(graph.vertex, vd0)] = position[graph.cell(graph.vertex, vd1)].clone();
						graph_renderer.update_edges();
						graph_renderer.update_points();
						selector.update_points();
						selector.update_edges();
						selected_point = vd0;
					}
					else
					{
						selected_point = intersections[0].object.dart;
					}
					selected_edge = null;
					selector.highlight_point(selected_point);
					selector.unhighlight_edge();
					window.addEventListener('mousemove', onMouseMove_point, false)
					window.addEventListener('mouseup', onMouseUp_point, false);
				
				}
				else{
					selected_edge = null;
					selected_point = null;
					selector.unhighlight_edge();
					selector.unhighlight_point();

				}
			}
			else
			{
				let intersections = raycaster.intersectObjects(selector.edges.children);
				if(intersections.length)
				{
					plane.position.copy(intersections[0].point);
					planex.position.copy(intersections[0].point);
					planey.position.copy(intersections[0].point);
					planez.position.copy(intersections[0].point);

					selected_edge = intersections[0].object;
					selector.highlight_edge(selected_edge.dart);
					selected_point = null;
					selector.unhighlight_point();
				}
			}
		}
	}
}

// window.addEventListener( 'mousedown', onMouseDown, false );
// window.addEventListener( 'keydown', onKeyDown, false );



let gui = new dat.GUI({autoPlace: true, hideable: false});

let gui_params = {
	x: 0,
	y: 0,
	z: 0,
	add_vertex: function() 
	{
		let vd = graph.add_vertex();
		position[graph.cell(graph.vertex, vd)] = new THREE.Vector3(this.x, this.y, this.z);
		graph_renderer.update_edges();
		graph_renderer.update_points();
		selector.update_points();
		selector.update_edges();
	},
	fileNameCG: "",
	save_cg: function()
	{
		saveData(export_cg(graph), this.fileNameCG);
	}
};

gui.add(gui_params, "x");
gui.add(gui_params, "y");
gui.add(gui_params, "z");
gui.add(gui_params, "add_vertex");
gui.add(gui_params, "fileNameCG");
gui.add(gui_params, "save_cg");




let surface_mesh = new CMap2();
let surface_renderer = new Renderer(surface_mesh);
// surface_renderer.create_edges();
// surface_renderer.add_edges(scene);












let clock = new THREE.Clock();

function update ()
{
	plane.rotation.copy(camera.rotation);
	let delta = clock.getDelta();
	trackballcontrols.update(delta);
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

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});


function FileDroppedOnCanevas(func)
{
        canvas.addEventListener("dragenter", e =>
        {
                e.stopPropagation();
                e.preventDefault();
        }, false);

        canvas.addEventListener("dragover",  e =>
        {
                e.stopPropagation();
                e.preventDefault();
        }, false);

        canvas.addEventListener("drop", e =>
        {
                e.stopPropagation();
                e.preventDefault();
                const dt = e.dataTransfer;
                const files = dt.files;
                func(files[0]);
         }, false);
}

let bb_mid;
function get_bounding_box_mid()
{
	let v_min = undefined;
	let v_max = undefined;
	graph.foreach(graph.vertex, vd => {
		if(!v_min)
		{
			v_min = position[graph.cell(graph.vertex, vd)].clone();
			v_max = position[graph.cell(graph.vertex, vd)].clone();
		}
		else
		{
			let p = position[graph.cell(graph.vertex, vd)];
			v_min.x = v_min.x > p.x ? p.x : v_min.x;
			v_min.y = v_min.y > p.y ? p.y : v_min.y;
			v_min.z = v_min.z > p.z ? p.z : v_min.z;

			v_max.x = v_max.x < p.x ? p.x : v_max.x;
			v_max.y = v_max.y < p.y ? p.y : v_max.y;
			v_max.z = v_max.z < p.z ? p.z : v_max.z;
		}
	});

	console.log(v_min, v_max);
	bb_mid = new THREE.Vector3().addVectors(v_min, v_max).multiplyScalar(0.5);
	trackballcontrols.target.copy(bb_mid);
}
get_bounding_box_mid();

function get_average_edge()
{
	let nb_edges = graph.nb_cells(graph.edge);
	let length_sums = 0;
	graph.foreach(graph.edge, ed => {
		let v0 = position[graph.cell(graph.vertex, ed)].clone()
		let v1 = position[graph.cell(graph.vertex, graph.alpha0[ed])].clone()
		length_sums += v0.distanceTo(v1);
		// v_min = position[graph.cell(graph.vertex, vd)].clone();
			// v_max = position[graph.cell(graph.vertex, vd)].clone();

	});
	length_sums /= nb_edges;
	return  length_sums;
}

function load(blob)
{
	let file_name = blob.name;
	let reader = new FileReader();
	return new Promise( (resolve, reject) =>
	{
		reader.onerror = () => 
		{
			reader.abort();
			ewgl_common.console.error('can not load '+blob.name);
			reject();
		};
		reader.onload = () => 
		{
			resolve(reader.result);
		};
		reader.readAsText(blob);
	});
}

FileDroppedOnCanevas( (blob) =>
{
        load(blob).then((mesh) =>
        {
			if(blob.name.match(/.cg/))
			{
				graph = graph_from_geometry(import_cg(mesh));
				position = graph.get_attribute(graph.vertex, "position");
				graph_renderer.delete_points();
				graph_renderer.delete_edges();
				graph_renderer = new Renderer(graph);
				graph_renderer.create_edges();
				graph_renderer.create_points();
				graph_renderer.add_edges(scene);
				graph_renderer.add_points(scene);
				let edge_len = get_average_edge();
				selector.delete_points();
				selector.delete_edges();
				selector = new Selector(graph);
				selector.create_points({size: edge_len / 5});
				scene.add(selector.points);
				scene.add(selector.point_highlighter);
				selector.create_edges({size: edge_len / 5});
				scene.add(selector.edges);
				scene.add(selector.edge_highlighter);
				selector.modify_highlighters(edge_len / 4.5);
			}
			if(blob.name.match(/.cgr/))
				console.log("cgr file");
			if(blob.name.match(/.off/))
			{
				if(surface_renderer.faces) surface_renderer.remove_faces();
				// surface_renderer.remove_edges();
				surface_mesh = cmap2_from_geometry(load_off(mesh));
				surface_renderer = new Renderer(surface_mesh);
				// surface_renderer.create_edges();
				// surface_renderer.add_edges(scene);
				
				surface_renderer.create_faces({transparent: true, opacity: 0.25});
				surface_renderer.add_faces(scene);

			}
			get_bounding_box_mid();	
        });
});

function saveData(data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "cg/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

}

loop();
