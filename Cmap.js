"use strict";

function CMap_Base()
{
	const attributes_containers = [];
	const topology = {};
	this.topology = topology;
	const embeddings = [];
	
	this.funcs_set_embeddings = [];
	this.funcs_foreach = [];
	this.funcs_foreach_dart_of = [];

	this.add_celltype = function()
		{
			const emb = attributes_containers.length;
			attributes_containers[emb] = new Attributes_Container();
			return emb;
		}
	
	this.add_topology_relation = function(name)
		{
			topology[name] = this.add_attribute(this.dart, "<topo_" + name + ">");
			return topology[name];
		}
	
	this.add_attribute = function(emb, name)
		{	
			return attributes_containers[emb].create_attribute(name)	
		}

	this.get_attribute = function(emb, name)
		{	
			return attributes_containers[emb].get_attribute(name)	
		}

	this.remove_attribute = function(emb, attrib)
		{	
			attributes_containers[emb].remove_attribute(attrib.name)	
		}

	this.new_cell = function(emb)
		{	
			return attributes_containers[emb].new_element();	
		}

	this.nb_cells = function(emb)
		{
			let i = 0;
			this.foreach(emb, c => {++i});
			return i;
		}

	this.delete_cell = function(emb, e)
		{	
			attributes_containers[emb].delete_element(e)	
		}

	this.create_embedding = function(emb)
		{	
			if(!embeddings[emb])	
				embeddings[emb] = this.add_attribute(this.dart, "<emb_" + emb + ">")	
		}

	this.is_embedded = function(emb)
		{	return (embeddings[emb]);	};

	this.cell = function(emb, d)
		{
			return embeddings[emb][d];
		}

	this.set_embedding = function(emb, d, i)
		{
			attributes_containers[emb].ref(i);
			attributes_containers[emb].unref(embeddings[emb][d]);	
			return embeddings[emb][d] = i;
		}

	this.set_embeddings = function(emb)
		{
			this.funcs_set_embeddings[emb].call(this);
		}

	this.new_dart = function()
		{
			let new_id = this.new_cell(this.dart);
			Object.values(topology).forEach(relation => relation[new_id] = new_id);
			return new_id;
		}

	this.delete_dart = function(d)
		{
			for(let emb = 0; emb < attributes_containers.length; ++emb)
				if(this.is_embedded(emb))
					attributes_containers[emb].unref(embeddings[emb][d]);
			topology.d[d] = -1;
			attributes_containers[this.dart].delete_element(d);
		}

	this.foreach_dart = function(func)
		{
			topology.d.some( d => (d != -1) ? func(d) : undefined );
		}

	this.nb_darts = function()
		{
			return attributes_containers[this.dart].nb_elements();
		}
	
	this.foreach = function(emb, func, cache)
		{
			this.funcs_foreach[emb].call(this, func, cache);
		}

	this.foreach_dart_of = function(emb, cell, func)
		{
			this.funcs_foreach_dart_of[emb].call(this, cell, func);
		}

	this.cache = function(emb, cond)
		{
			let cache = [];

			if(!cond)
				this.foreach(emb, cd => { cache.push(cd) });
			else
				this.foreach(emb, cd => { if(cond(cd)) cache.push(cd) });
				
			return cache;
		}

	this.delete_map = function()
		{
			attributes_containers.forEach(ac => ac.delete());
			delete this.funcs_foreach;
			delete this.funcs_foreach_dart_of;
			delete this.funcs_set_embeddings;
		}

	this.close = function()
		{}

	this.dart = this.add_celltype();
	this.funcs_set_embeddings[this.dart] = function()
		{
			if(!this.is_embedded(this.dart))
				this.create_embedding(this.dart);

			this.foreach_dart(d => {
				this.set_embedding(this.dart, d, d);
			});
		}

	this.funcs_foreach[this.dart] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}

			this.foreach_dart(func);
		}

	this.funcs_foreach_dart_of[this.dart] = function(d, func) {func(d)};
	
	this.d = this.add_topology_relation("d");

	this.new_marker = function(name = "")
		{
			const cmap = this;
			function Marker(name = "")
				{
					let marker = cmap.add_attribute(cmap.dart, "<marker_" + name + ">");
					marker.mark = function(d) {this[d] = true};
					marker.unmark = function(d) {this[d] = false};
					marker.marked = function(d) {return this[d]};
					marker.mark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.mark(d))};
					marker.unmark_cell = function(emb, cd) {cmap.foreach_dart_of(emb, cd, d => marker.unmark(d))};
					marker.marked_cell = function(emb, cd) 
						{
							let marked = true;
							cmap.foreach_dart_of(emb, cd, d => { marked &= marker.marked(d)}) 
							return marked;
						}
 					return marker;
				}

			return new Marker(name);
		}

	let boundary_marker = this.new_marker("boundary");
	this.mark_as_boundary = function(d)
		{
			boundary_marker.mark(d);
		}

	this.unmark_as_boundary = function(d)
		{
			boundary_marker.unmark(d);
		}

	this.mark_cell_as_boundary = function(emb, cd)
		{
			boundary_marker.mark_cell(emb, cd)
		}

	this.unmark_cell_as_boundary = function(emb, cd)
		{
			boundary_marker.unmark_cell(emb, cd);
		}

	this.is_boundary = function(d)
		{
			return boundary_marker.marked(d);
		}

	this.is_boundary_cell = function(emb, cd)
		{
			return boundary_marker.marked_cell(emb, cd);
		}

	this.degree = function(emb, cd)
		{
			let deg = 0;
			this.foreach_dart_of(emb, cd, d => {
				++deg;
			});
			return deg;
		}
}

function CMap0()
{
	CMap_Base.call(this);

	// ORBITS
	this.vertex = this.add_celltype();
	this.funcs_set_embeddings[this.vertex] = function()
		{
			if(!this.is_embedded(this.vertex))
				this.create_embedding(this.vertex);

			this.foreach_dart(d => {
				this.set_embedding(this.vertex, d, this.new_cell(this.vertex));
			});
		}

	this.funcs_foreach[this.vertex] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}

			this.foreach_dart(func);
		}

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func) {func(vd)};
}

function CMap1()
{
	CMap0.call(this);
	
	this.phi1 = this.add_topology_relation("phi1");
	this.phi_1 = this.add_topology_relation("phi_1");

	// TOPOLOGY
	this.sew_phi1 = function(d0, d1)
		{
			let e0 = this.phi1[d0];
			let e1 = this.phi1[d1];
			this.phi1[d0] = e1;
			this.phi1[d1] = e0;
			this.phi_1[e1] = d0;
			this.phi_1[e0] = d1;
		};

	this.unsew_phi1 = function(d0)
		{
			let d1 = this.phi1[d0];
			let d2 = this.phi1[d1];
	
			this.phi1[d0] = d2;
			this.phi1[d1] = d1;
			this.phi_1[d2] = d0;
			this.phi_1[d1] = d1;
		};

	this.foreach_dart_phi1 = function(d0, func)
		{
			let d = d0;
			do
			{
				if(func(d)) return;
				d = this.phi1[d];
			} while (d != d0);
		};
	

	// ORBITS
	this.edge = this.add_celltype();
	this.funcs_set_embeddings[this.edge] = function()
		{
			if(!this.is_embedded(this.edge))
				this.create_embedding(this.edge);

			this.foreach_dart(d => {
				this.set_embedding(this.edge, d, this.new_cell(this.edge));
			});
		}

	this.funcs_foreach[this.edge] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}
				
			this.foreach_dart(func);
		}

	this.funcs_foreach_dart_of[this.edge] = function(ed, func) {func(ed)};


	this.face = this.add_celltype();
	this.funcs_set_embeddings[this.face] = function()
	{
		if(!this.is_embedded(this.face))
			this.create_embedding(this.face);

		this.foreach(this.face, fd => {
			let fid = this.new_cell(this.face);
			this.foreach_dart_phi1(fd,
				d => {
					this.set_embedding(this.face, d, fid);
				}
			);
		});
	}

	this.funcs_foreach[this.face] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}
			
			let marker = this.new_marker();
			this.foreach_dart(
				d0 => {
					if(marker.marked(d0))
						return;

					this.foreach_dart_phi1(d0, d1 => {marker.mark(d1)});

					func(d0);
				}
			);

			marker.delete();
		}

	this.funcs_foreach_dart_of[this.face] = function(fd, func) 
		{
			this.foreach_dart_phi1(fd, d => func(d));
		};

	

	// OPERATIONS
	this.add_face = function(nb_sides, set_embeddings = true)
		{
			let d0 = this.new_dart();
			for(let i = 1; i < nb_sides; i++)
			{
				let d1 = this.new_dart();
				this.sew_phi1(d0, d1);
			}

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
					this.foreach_dart_phi1(d0, d1 => {
						this.set_embedding(this.vertex, d1, this.new_cell(this.vertex));
					});
				if(this.is_embedded(this.edge))
					this.foreach_dart_phi1(d0, d1 => {
						this.set_embedding(this.edge, d1, this.new_cell(this.edge));
					});
				if(this.is_embedded(this.face))
					{
						let fid = this.new_cell(this.face);
						this.foreach_dart_phi1(d0, d1 => {
							this.set_embedding(this.face, d1, fid);
						});
					}
			}

			return d0;
		}

	this.cut_edge = function(ed, set_embeddings = true)
		{
			let d0 = ed;
			let d1 = this.new_dart();

			this.sew_phi1(d0, d1);

			if(this.is_boundary(d0))
				this.mark_as_boundary(d1);

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
					this.set_embedding(this.vertex, d1, this.new_cell(this.vertex));
				if(this.is_embedded(this.edge))
					this.set_embedding(this.edge, d1, this.new_cell(this.edge));
				if(this.is_embedded(this.face))
					this.set_embedding(this.face, d1, this.new_cell(this.face));
			}

			return d1;
		}

	this.collapse_edge = function(ed, set_embeddings = true)
		{
			let d0 = this.phi_1[ed];
			this.unsew_phi1(d0);
			let d1 = this.phi1[d0];

			// if(set_embeddings){
				// handled by unref
			// }

			this.delete_dart(ed);
			return d1;
		}

	this.split_vertex = function(vd, set_embeddings = true)
		{
			let d0 = this.phi_1(vd);
			let d1 = this.new_dart();

			this.sew_phi1(d0, d1);

			if(this.is_boundary(d0))
				this.mark_as_boundary(d1);

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
					this.set_embedding(this.vertexd1, this.new_cell(this.vertex));
				if(this.is_embedded(this.edge))
					this.set_embedding(this.edged1, this.new_cell(this.edge));
				if(this.is_embedded(this.face))
					this.set_embedding(this.face, d1, this.cell(this.face, d0));
			}

			return d1;
		}
}

function CMap2()
{
	CMap1.call(this);

	// TOPOLOGY
	this.phi2 = this.add_topology_relation("phi2");
	
	this.volume = this.add_celltype();

	this.sew_phi2 = function(d0, d1)
		{
			this.phi2[d0] = d1;
			this.phi2[d1] = d0;
		};

	this.unsew_phi2 = function(d)
		{
			let d1 = this.phi2[d];
			this.phi2[d] = d;
			this.phi2[d1] = d1;
		};

	this.close = function(boundary = false, set_embeddings = true)
		{
			this.foreach_dart(
				d0 => {
					if(this.phi2[d0] == d0)
					{
						let d1 = d0;
						let path = [];

						do
						{
							d1 = this.phi1[d1];
							if(this.phi2[d1] != d1)
							{
								while(this.phi2[d1] != d1)
								{
									d1 = this.phi1[this.phi2[d1]];
								}	
							}
							path.push(d1);
						} while(d1 != d0);
						
						let fd = this.add_face(path.length, false);
						if(boundary)
							this.mark_cell_as_boundary(this.face, fd);
						for(let i = 0; i < path.length; ++i)
						{
							this.sew_phi2(fd, path[i]);
							fd = this.phi_1[fd];
						}


						if(set_embeddings)
						{
							let fid = this.is_embedded(this.face)? this.new_cell(this.face) : undefined;
							this.foreach_dart_of(this.face, fd, d => {
								if(this.is_embedded(this.vertex))
								{
									this.set_embedding(this.vertex, d, this.cell(this.vertex, this.phi1[this.phi2[d]]));
								}
								if(this.is_embedded(this.edge))
								{
									this.set_embedding(this.edge, d, this.cell(this.edge, this.phi2[d]));
								}
								if(this.is_embedded(this.face))
								{
									this.set_embedding(this.face, d, fid);
								}
							});
						}
					}
				});
		}

	// ORBITS
	this.foreach_dart_phi2 = function(d, func)
		{
			if(!func(d))
				func(this.phi2[d]);	
		}

	this.foreach_dart_phi12 = function(d0, func)
		{
			let d = d0;
			do
			{
				if(func(d)) break;
				d = this.phi1[this.phi2[d]];
			} while (d != d0);
		};

	// TODO	: TEST 	
	this.foreach_dart_phi1_phi2 = function(d0, func)
		{
			let marker = this.new_marker();
			let faces = [d0];
			while(faces.length)
				{
					let fd = faces.shift();
					this.foreach_dart_phi1(fd, 
						d => {
							if(!marker.marked(d))
								{	
									marker.mark(d);
									func(d);
								}							
							if(!marker.marked(this.phi2[d]))
								faces.push(this.phi2[d]);
							});
				}

			marker.delete();
		};

	this.funcs_set_embeddings[this.vertex] = function()
		{
			if(!this.is_embedded(this.vertex))
				this.create_embedding(this.vertex);

			this.foreach(this.vertex, vd => {
				let vid = this.new_cell(this.vertex);
				this.foreach_dart_phi12(vd,
					d => {
						this.set_embedding(this.vertex, d, vid);
					}
				);
			});
		}

	this.funcs_foreach[this.vertex] = function(func, cache)
		{
			if(cache)
				{
					cache.some(d => func(d));
					return;
				}

			let marker = this.new_marker();
			this.foreach_dart( 
				d => {
					if(marker.marked(d))
						return;

					this.foreach_dart_phi12(d, d1 => {marker.mark(d1)});
					return func(d);
				});

			marker.delete();
		}

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func) 
		{
			this.foreach_dart_phi12(vd, func);
		};


	this.funcs_set_embeddings[this.edge] = function()
		{
			if(!this.is_embedded(this.edge))
				this.create_embedding(this.edge);

			this.foreach(this.edge, ed => {
				let eid = this.new_cell(this.edge);
				this.foreach_dart_phi2(ed,
					d => {
						this.set_embedding(this.edge, d, eid);
					}
				);
			});
		}

	this.funcs_foreach[this.edge] = function(func, cache)
		{
			if(cache)
			{
				cache.forEach(ed => func(ed));
				return;
			}

			let marker = this.new_marker();
			this.foreach_dart(
				d => {
					if(marker.marked(d))
						return;

					marker.mark(d);
					marker.mark(this.phi2[d]);

					func(d);
				}
			);
			marker.delete();
		}

	this.funcs_foreach_dart_of[this.edge] = function(ed, func)
		{
			this.foreach_dart_phi2(ed, func);
		}


	this.funcs_set_embeddings[this.volume] = function()
		{
			if(!this.is_embedded(this.volume))
				this.create_embedding(this.volume);

			this.foreach(this.volume, wd => {
				let wid = this.new_cell(this.volume);
				console.log("wid: ", wid)
				this.foreach_dart_phi1_phi2(wd,
					d => {
						this.set_embedding(this.volume, d, wid);
					}
				);
			});
		}

	this.funcs_foreach[this.volume] = function(func, cache)
		{
			if(cache)
			{
				cache.forEach(wd => func(wd));
				return;
			}

			let marker = this.new_marker();
			this.foreach_dart(
				d0 => {
					if(marker.marked(d0))
						return;

					this.foreach_dart_phi1_phi2(d0, d1 => marker.mark(d1));
					func(d0);
				}
			);
			marker.delete();
		}

	this.funcs_foreach_dart_of[this.volume] = function(wd, func)
		{
			this.foreach_dart_phi1_phi2(wd, func);
		}

	// OPERATIONS
	this.cut_edge1 = this.cut_edge;
	this.cut_edge = function(ed, set_embeddings = true)
		{
			let d0 = ed;
			let e0 = this.phi2[d0];
			this.unsew_phi2(d0);

			let d1 = this.cut_edge1(d0, false);
			let e1 = this.cut_edge1(e0, false);

			this.sew_phi2(d0, e1);
			this.sew_phi2(e0, d1);	

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
				{
					let vid = this.new_cell(this.vertex);
					this.set_embedding(this.vertex, d1, vid);
					this.set_embedding(this.vertex, e1, vid);
				}
				if(this.is_embedded(this.edge))
				{
					let eid = this.new_cell(this.edge);
					this.set_embedding(this.edge, d1, this.cell(this.edge, e0));
					this.set_embedding(this.edge, e1, eid);
					this.set_embedding(this.edge, d0, eid);
				}
				if(this.is_embedded(this.face))
				{
					this.set_embedding(this.face, d1, this.cell(this.face, d0));
					this.set_embedding(this.face, e1, this.cell(this.face, e0));
				}
			}

			return d1;
		}

	this.collapse_edge1 = this.collapse_edge;
	this.collapse_edge = function(ed, set_embeddings = true)
		{
			let d0 = ed;
			let e0 = this.phi2[ed];
			let eid = this.cell(this.edge, ed);
			
			this.unsew_phi2(d0);
			let d1 = this.collapse_edge1(d0, false);
			let e1 = this.collapse_edge1(e0, false);
			
			if(set_embeddings){
				if(this.is_embedded(this.vertex))
				{
					let vid0 = this.cell(this.vertex, d1);
					let vid1 = this.cell(this.vertex, e1);
					this.foreach_dart_phi12(e1,
						d => {
							this.set_embedding(this.vertex, d, vid0);
						}
					);
					this.delete_cell(this.vertex, vid1); // should remove this and test
				}
			}
			
			return d1;
		}

	this.split_vertex1 = this.split_vertex;
	this.split_vertex = function(vd0, vd1, set_embeddings = true)
		{

			let d0 = this.split_vertex1(vd0, false);
			let d1 = this.split_vertex1(vd1, false);

			this.sew_phi2(d0, d1);

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
				{
					let vid = this.new_cell(this.vertex);
					this.foreach_dart_of(this.vertex, d0, 
						d => {
							this.set_embedding(this.vertex, d, vid);
						});
					this.set_embedding(this.vertex, d1, this.cell(this.vertex, vd0));
				}
				if(this.is_embedded(this.edge))
				{
					let eid = this.new_cell(this.edge);
					this.set_embedding(this.edge, d0, eid);
					this.set_embedding(this.edge, d1, eid);
				}
				if(this.is_embedded(this.face))
				{
					this.set_embedding(this.face, d0, this.cell(this.face, vd0));
					this.set_embedding(this.face, d1, this.cell(this.face, vd1));
				}
			}

			return d0;
		}

	this.cut_face = function(fd0, fd1, set_embeddings = true)
	{
		let d0 = this.phi_1[fd0];
		let d1 = this.phi_1[fd1];

		let e0 = this.new_dart();
		let e1 = this.new_dart();
		this.sew_phi2(e0, e1);
		this.sew_phi1(d0, e0);
		this.sew_phi1(d1, e1);
		this.sew_phi1(e0, e1);

		if(this.is_boundary_cell(this.face, fd0))
			this.mark_cell_as_boundary(this.edge, e0);

		if(set_embeddings){
			if(this.is_embedded(this.vertex))
			{
				this.set_embedding(this.vertex, e0, this.cell(this.vertex, this.phi1[this.phi2[e0]]));
				this.set_embedding(this.vertex, e1, this.cell(this.vertex, this.phi1[this.phi2[e1]]));
			}
			if(this.is_embedded(this.edge))
			{
				let eid = this.new_cell(this.edge);
				this.set_embedding(this.edge, e0, eid);
				this.set_embedding(this.edge, e1, eid);
			}
			if(this.is_embedded(this.face))
			{
				this.set_embedding(this.face, e0, this.cell(this.face, this.phi1[e0]));
				let fid = this.new_cell(this.face);
				this.foreach_dart_phi1(e1,
					d => {
						this.set_embedding(this.face, d, fid);
					}
				);
			}
		}

		return e0;
	}

	this.merge_faces = function(ed, set_embeddings = true)
	{
		let fd = this.phi1[ed];
		let d0 = ed, 
			d1 = this.phi2[ed];

		this.sew_phi1(this.phi_1[d0], d1);
		this.sew_phi1(this.phi_1[d1], d0);

		if(set_embeddings){
			if(this.is_embedded(this.face))
			{
				let fid0 = this.cell(this.face, d0);
				this.foreach_dart_of(this.face, fd, 
					d => {
						this.set_embedding(this.face, d, fid0);
					});
			}
		}

		this.delete_dart(d0);
		this.delete_dart(d1);
	}


	this.flip_edge = function(ed, set_embeddings = true)
		{
			let d0 = ed,
				d1 = this.phi1[d0],
				e0 = this.phi2[ed],
				e1 = this.phi1[e0];

			this.sew_phi1(this.phi_1[d0], e0);
			this.sew_phi1(this.phi_1[e0], d0);

			this.sew_phi1(e0, e1);
			this.sew_phi1(d0, d1);

			if(set_embeddings){
				if(this.is_embedded(this.vertex))
				{
					this.set_embedding(this.vertex, d0, this.cell(this.vertex, this.phi1[e0]));
					this.set_embedding(this.vertex, e0, this.cell(this.vertex, this.phi1[d0]));
				}
				if(this.is_embedded(this.face))
				{
					this.set_embedding(this.face, this.phi_1[d0], this.cell(this.face, d0));
					this.set_embedding(this.face, this.phi_1[e0], this.cell(this.face, e0));
				}
			}

			return ed;
		}
}

function CMap3()
{
	CMap2.call(this);

	this.phi3 = this.add_topology_relation("phi3");
	
	this.connex = this.add_celltype();

	this.sew_phi3 = function(d0, d1)
		{
			this.phi3[d0] = d1;
			this.phi3[d1] = d0;
		};

	this.unsew_phi3 = function(d)
		{
			let d1 = this.phi3[d];
			this.phi3[d] = d;
			this.phi3[d1] = d1;
		};

// // 	//add foreach dart of phi23
// // 	//add foreach dart of phi13
// // 	//add foreach dart of phi1_phi2_phi3
}


function Graph()
{
	CMap_Base.call(this);

	this.alpha0 = this.add_topology_relation("alpha0");
	this.alpha1 = this.add_topology_relation("alpha1");
	this.alpha_1 = this.add_topology_relation("alpha_1");
	this.phi1 = this.alpha0;

	this.sew_alpha0 = function(d0, d1)
		{
			this.alpha0[d0] = d1;
			this.alpha0[d1] = d0;
		}

	this.unsew_alpha0 = function(d0)
		{
			const d1 = this.alpha0[d0];
			this.alpha0[d0] = d0;
			this.alpha0[d1] = d1;
		}

	this.sew_alpha1 = function(d0, e0)
		{
			const d1 = this.alpha1[d0];
			const e1 = this.alpha1[e0];
			this.alpha1[d0] = e1;
			this.alpha1[e0] = d1;
			this.alpha_1[d1] = e0;
			this.alpha_1[e1] = d0;
		}

	this.unsew_alpha1 = function(d0)
		{
			const d1 = this.alpha1[d0];
			const d_1 = this.alpha_1[d0];

			this.alpha1[d0] = d0;
			this.alpha_1[d0] = d0;
			this.alpha1[d_1] = d1;
			this.alpha_1[d1] = d_1;
		}

	this.foreach_dart_alpha0 = function(d0, func)
		{
			if(!func(d0))
				func(this.alpha0[d0]);
		}

	this.foreach_dart_alpha1 = function(d0, func)
		{
			let d = d0;
			do
			{
				if(func(d)) break;
				d = this.alpha1[d];
			} while(d != d0)
		}

	this.vertex = this.add_celltype();

	this.funcs_set_embeddings[this.vertex] = function()
		{
			if(!this.is_embedded(this.vertex))
				this.create_embedding(this.vertex);

			this.foreach(this.vertex, 
				vd => {
					let vid = this.new_cell(this.vertex);
					this.foreach_dart_alpha1(vd, d => {
						this.set_embedding(this.vertex, d, vid);
				});
			});
		}

	this.funcs_foreach[this.vertex] = function(func, cache)
		{
			if(cache)
			{
				cache.some(d => func(d));
				return;
			}

			let marker = this.new_marker();
			this.foreach_dart( 
				d => {
					if(marker.marked(d))
						return;

					this.foreach_dart_alpha1(d, d1 => {marker.mark(d1)});
					return func(d);
				});
			marker.delete();
		}

	this.funcs_foreach_dart_of[this.vertex] = function(vd, func) 
	{
		this.foreach_dart_alpha1(vd, d => {func(d)});
	};


	this.edge = this.add_celltype();

	this.funcs_set_embeddings[this.edge] = function()
		{
			if(!this.is_embedded(this.edge))
				this.create_embedding(this.edge);

			this.foreach(this.edge, 
				ed => {
					let eid = this.new_cell(this.edge);
					this.foreach_dart_alpha0(ed, d => {
						this.set_embedding(this.edge, d, eid);
				});
			});
		}

	this.funcs_foreach[this.edge] = function(func, cache)
		{
			if(cache)
			{
				cache.some(d => func(d));
				return;
			}

			let marker = this.new_marker();
			this.foreach_dart( 
				d => {
					if(this.alpha0[d] == d || marker.marked(d))
						return;
					console.log
					this.foreach_dart_alpha0(d, d1 => {marker.mark(d1)});
					return func(d);
				});
			marker.delete();
		}

	this.funcs_foreach_dart_of[this.edge] = function(ed, func) 
		{
			this.foreach_dart_alpha0(ed, d => {func(d)});
		}

	this.add_vertex = function(set_embeddings = true)
		{
			let d = this.new_dart();
			if(set_embeddings)
			{
				if(this.is_embedded(this.vertex))
					this.set_embedding(this.vertex, d, this.new_cell(this.vertex));
			}
			return d;
		}

	this.delete_vertex = function(vd0, set_embeddings = true)
		{
			let vd1 = this.alpha1[vd0];
			while(vd1 != vd0)
			{
				let vd_1 = vd1;
				vd1 = this.alpha1[vd1];
				this.disconnect_vertices(this.alpha0[vd_1], vd_1, set_embeddings);
			}
			this.disconnect_vertices(this.alpha0[vd0], vd0, set_embeddings);
			this.delete_dart(vd0);
		}

	this.connect_vertices = function(d0, e0, set_embeddings = true)
		{
			let d = (this.alpha0[d0] == d0)? d0 : this.new_dart(); 
			let e = (this.alpha0[e0] == e0)? e0 : this.new_dart();
			if(d != d0) this.sew_alpha1(d0, d);
			if(e != e0) this.sew_alpha1(e0, e);

			this.sew_alpha0(d, e);

			if(set_embeddings)
			{
				if(this.is_embedded(this.vertex))
				{
					if(d != d0) this.set_embedding(this.vertex, d, this.cell(this.vertex, d0));
					if(e != e0) this.set_embedding(this.vertex, e, this.cell(this.vertex, e0));
				}
				if(this.is_embedded(this.edge))
				{
					let eid = this.new_cell(this.edge);
					this.set_embedding(this.edge, d, eid);
					this.set_embedding(this.edge, e, eid);
				}
			}

			return d;
		}
	
	this.disconnect_vertices = function(vd0, vd1, set_embeddings = true)
		{
			let val0 = 0;
			this.foreach_dart_alpha1(vd0, d => {if(this.alpha0[d] != vd0) ++val0;});
			let val1 = 0;
			this.foreach_dart_alpha1(vd1, d => {if(this.alpha0[d] != vd1) ++val1;});
			this.unsew_alpha0(vd0);

			if(set_embeddings)
			{
				if(this.is_embedded(this.edge))
				{
					let eid = this.cell(this.edge, d0);
					this.delete_cell(this.edge, eid);
				}
			}

			if(val0 > 1) 
				{
					this.unsew_alpha1(vd0);
					this.delete_dart(vd0);
				}
			if(val1 > 1)
				{
					this.unsew_alpha1(vd1);
					this.delete_dart(vd1);
				}
		}

	this.cut_edge = function(ed, set_embeddings = true)
		{
			let ed0 = ed;
			let ed1 = this.alpha0[ed];

			let vd0 = this.new_dart();
			let vd1 = this.new_dart();

			this.sew_alpha1(vd0, vd1);
			this.unsew_alpha0(ed0);
			this.sew_alpha0(ed0, vd0);
			this.sew_alpha0(ed1, vd1);

			if(set_embeddings)
			{
				if(this.is_embedded(this.vertex))
				{
					let vid = this.new_cell(this.vertex);
					this.set_embedding(this.vertex, vd0, vid);
					this.set_embedding(this.vertex, vd1, vid);
				}
				if(this.is_embedded(this.edge))
				{
					this.set_embedding(this.edge, vd0, this.cell(this.edge, ed0));
					let eid = this.new_cell(this.edge);
					this.set_embedding(this.edge, vd1, eid);
					this.set_embedding(this.edge, ed1, eid);
				}
			}

			return vd0;
		}

	this.collapse_edge = function(ed, set_embeddings = true)
		{
			let d0 = this.alpha0[ed];
			let d1 = this.alpha1[d0];
			while(d1 != d0)
			{
				let d2 = this.alpha1[d1];
				this.unsew_alpha1(d1);
				this.sew_alpha1(d1, ed);
				d1 = d2;
			}

			if(set_embeddings)
			{
				if(this.is_embedded(this.vertex))
				{
					let eid = this.cell(this.vertex, ed);
					this.foreach_dart_alpha1(ed, d => {
						this.set_embedding(this.vertex, d, eid);
					});
				}
			}
			this.delete_dart(d0);
			this.delete_dart(ed);
		}

	this.merge_edges = function(vd, set_embeddings = true)
		{
			if(this.degree(this.vertex, vd) != 2) return;

			let d0 = vd;
			let d1 = this.alpha1[d0];

			let e0 = this.alpha0[d0];
			let e1 = this.alpha0[d1];
			this.unsew_alpha0(d0);
			this.unsew_alpha0(d1);
			this.sew_alpha0(e0, e1);
			
			this.delete_dart(d0);
			this.delete_dart(d1);

			if(set_embeddings)
			{
				if(this.is_embedded(this.edge))
				{
					let eid = this.cell(this.edge, e0);
					this.set_embedding(this.edge, e1, eid);
				}
			}
		}
}





function load_off(off_str)
{
	let lines = off_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}
	let line;
	// skip header
	while(!parseInt(line = lines.shift()) && lines.length)
	{}
	// get nb_vert nb_face nb_edge(=0)
	let v_f_e = line.split(" ");
	// get vertices positions
	let vertices = [];
	for(let i = 0; i < v_f_e[0]; i++)
	{
		line = lines.shift();
		vertices.push(line.split(" "));
	}        
	// get faces id
	let faces = [];
	for(let i = 0; i < v_f_e[1]; i++)
	{
		line = lines.shift();
		let face0 = line.split(" ");
		let v_nb = face0.shift();
		faces.push(face0);
	}
	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	faces = faces.map(x => x.map(y => parseInt(y)));
	
	console.log("file loaded: " + vertices.length + " vertices, " + faces.length + " faces");
	return {v: vertices, f:faces};
}

function cmap2_from_geometry(geo_info)
{
	let cmap2 = new CMap2;
	let position = cmap2.add_attribute(cmap2.vertex, "position");
	let dart_per_vertex = cmap2.add_attribute(cmap2.vertex, "dart_per_vertex");

	let vertex_ids = [];
	// vertex_ids.length = geo_info.v.length;
	geo_info.v.forEach(vertex => {
		let i = cmap2.new_cell(cmap2.vertex);
		vertex_ids.push(i);
		dart_per_vertex[i] = [];
		position[i] = new THREE.Vector3(vertex[0], vertex[1], vertex[2]);
	})

	cmap2.set_embeddings(cmap2.vertex);
	geo_info.f.forEach(face => {
		let d = cmap2.add_face(face.length, false);
		for(let i = 0; i < face.length; i++)
		{
			cmap2.set_embedding(cmap2.vertex, d, face[i]);
			dart_per_vertex[face[i]].push(d);
			d = cmap2.phi1[d];
		}
	});

	let v0 = -1;
	cmap2.foreach_dart(
		d0 => {
			v0 = cmap2.cell(cmap2.vertex, d0);
			dart_per_vertex[cmap2.cell(cmap2.vertex, cmap2.phi1[d0])].forEach(d1 => {
				if(cmap2.cell(cmap2.vertex, cmap2.phi1[d1]) == v0)
				{
					cmap2.sew_phi2(d0, d1);
				}
			});
		}
	);
	cmap2.close(true);

	dart_per_vertex.delete();

	
	return cmap2;
}

function export_cgr(graph)
{
	const vertex = graph.vertex;
	const edge = graph.edge;

	const position = graph.get_attribute(vertex, "position");
	const radius = graph.get_attribute(vertex, "radius");
	const vid = graph.add_attribute(vertex, "id");

	let nb_verts = graph.nb_cells(vertex);
	let nb_edges = graph.nb_cells(edge);
	let cgr_str = "# D:3 NV:" + nb_verts + " NE:" + nb_edges +"\n";

	let pt;
	let id = 0;
	graph.foreach(vertex, vd => {
		pt = position[graph.cell(vertex, vd)];
		vid[graph.cell(vertex, vd)] = id++;
		cgr_str += "v " + pt.x + " " + pt.y + " " + pt.z + " " + (radius? radius[graph.cell(vertex, vd)] : 0.1) + "\n";
	});

	graph.foreach(edge, ed => {
		cgr_str += "e " + vid[graph.cell(vertex, ed)] + " " + vid[graph.cell(vertex, graph.alpha0[ed])] + "\n";
	});

	vid.delete();
	return cgr_str;
}

function export_cg(graph)
{
	const vertex = graph.vertex;
	const edge = graph.edge;

	const position = graph.get_attribute(vertex, "position");
	const vid = graph.add_attribute(vertex, "id");

	let nb_verts = graph.nb_cells(vertex);
	let nb_edges = graph.nb_cells(edge);
	let cg_str = "# D:3 NV:" + nb_verts + " NE:" + nb_edges +"\n";

	let pt;
	let id = 0;
	graph.foreach(vertex, vd => {
		pt = position[graph.cell(vertex, vd)];
		vid[graph.cell(vertex, vd)] = id++;
		cg_str += "v " + pt.x + " " + pt.y + " " + pt.z + "\n";
	});

	graph.foreach(edge, ed => {
		cg_str += "e " + vid[graph.cell(vertex, ed)] + " " + vid[graph.cell(vertex, graph.alpha0[ed])] + "\n";
	});

	vid.delete();
	return cg_str;
}

function import_cg(cg_str)
{
	let lines = cg_str.split("\n");
	for(let i = 0; i < lines.length; i++)
	{
		lines[i] = lines[i].replace(/\s\s+/g, ' ').trim();
	}

	let line;
	line = lines.shift();
	let header = line.split(" ");
	let nb_dims = parseInt(header[1].split(":")[1]);
	let nb_verts = parseInt(header[2].split(":")[1]);
	let nb_edges = parseInt(header[3].split(":")[1]);

	let vertices = [];
	for(let i = 0; i < nb_verts; ++i)
	{
		line = lines.shift();
		vertices.push(line.slice(2).split(" "));
	}

	let edges = [];
	for(let i = 0; i < nb_edges; ++i)
	{
		line = lines.shift();
		edges.push(line.slice(2).split(" "));
	}

	vertices = vertices.map(x => x.map(y => parseFloat(y)));
	edges = edges.map(x => x.map(y => parseInt(y)));
	
	console.log("file loaded: " + vertices.length + " vertices, " + edges.length + " edges");
	return {v: vertices, e:edges};
}

function graph_from_geometry(geo_info = {v: [], e: []})
{
	let graph = new Graph;
	const vertex = graph.vertex;
	const edge = graph.edge;

	graph.create_embedding(vertex);
	const position = graph.add_attribute(vertex, "position");

	const vertex_ids = [];
	geo_info.v.forEach(v3 => {
		let vd = graph.add_vertex(true);
		vertex_ids.push(vd);
		position[graph.cell(vertex, vd)] = new THREE.Vector3(v3[0], v3[1], v3[2]);
	});

	geo_info.e.forEach(e => {
		graph.connect_vertices(vertex_ids[e[0]], vertex_ids[e[1]]);
	});

	return graph;
}