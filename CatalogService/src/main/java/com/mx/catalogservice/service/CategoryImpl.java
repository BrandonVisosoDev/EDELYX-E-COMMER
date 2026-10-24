package com.mx.catalogservice.service;


import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.model.CategoryRequest;
import com.mx.catalogservice.model.CategoryResponse;
import com.mx.catalogservice.repository.CategoryDao;
import org.springframework.stereotype.Service;

import java.util.List;


@Service

public class CategoryImpl implements MetodosCategory {

    // Inyectamos por constructor

   private final CategoryDao categoryDao;

   public CategoryImpl(CategoryDao categoryDao) {

        this.categoryDao = categoryDao;


    }

    // Metodo Crear


    public CategoryResponse createCategory(CategoryRequest request){

        // 1. VALIDAMOS QUE NO EXISTA UNA CATEGORIA CON ESE NOMBRE

        if(categoryDao.existsByName(request.getName())){

            throw new IllegalArgumentException("Ya existe una categoria con ese nombre");

        }

        // 2. MAPEAMOS DE REEQUEST A ENTITY

        Category nuevaCategoria = new Category();
        nuevaCategoria.setName(request.getName());
        nuevaCategoria.setActive(true);

        // 3. PERSISTIMOS LA CATEGORIA EN LA BASE DE DATOS

        Category guardado = categoryDao.save(nuevaCategoria);

        // 4. MAPEAMOS DE ENTITY A RESPONSE

        return CategoryResponse.builder()
                .id(guardado.getId())
                .name(guardado.getName())
                .build();

    }

    // Metodo Listar

    public List<CategoryResponse> listActiveCategories(){

       // 1. OBTENEMOS SOLO LAS QUE NO ESTAN DESACTIVADAS (ACTIVE = TRUE)

        List<Category> categoriasActivas = categoryDao.findByActiveTrue();

      // 2. MAPEO DIRECTO: ENTIDADES A DTOS

        return categoriasActivas.stream()
            .map(categoria -> CategoryResponse.builder()
                        .id(categoria.getId())
                        .name(categoria.getName())
                        .build())
                .toList();

    }

    // Metodo Actualizar

    public CategoryResponse updateCategory(Long id, CategoryRequest request) {

        // 1. VALIDAMOS QUE EXISTA LA CATEGORIA CON ESE ID

        Category categoriaExistente = categoryDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe una categoria con ese id"));

        // 2. VALIDAMOS QUE NO EXISTA OTRA CATEGORIA CON ESE NOMBRE

        if(categoryDao.existsByName(request.getName()) && !categoriaExistente.getName().equals(request.getName())){

            throw new IllegalArgumentException("Ya existe una categoria con ese nombre");

        }

        // 3. ACTUALIZAMOS LOS DATOS DE LA CATEGORIA

        categoriaExistente.setName(request.getName());

        // 4. PERSISTIMOS LOS CAMBIOS EN LA BASE DE DATOS

        Category guardado = categoryDao.save(categoriaExistente);

        // 5. MAPEAMOS DE ENTITY A RESPONSE

        return CategoryResponse.builder()
                .id(guardado.getId())
                .name(guardado.getName())
                .build();

    }

    // Metodo Desactivar (Eliminacion Logica)

    public void deactivateCategory(Long id) {

        // 1. VALIDAMOS QUE EXISTA LA CATEGORIA CON ESE ID

        Category categoriaExistente = categoryDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe una categoria con ese id"));

        // 2. DESACTIVAMOS LA CATEGORIA

        categoriaExistente.setActive(false);

        // 3. PERSISTIMOS LOS CAMBIOS EN LA BASE DE DATOS

        categoryDao.save(categoriaExistente);




    }

}
