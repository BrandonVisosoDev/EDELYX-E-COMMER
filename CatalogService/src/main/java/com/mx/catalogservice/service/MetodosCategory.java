package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.model.CategoryRequest;
import com.mx.catalogservice.model.CategoryResponse;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface MetodosCategory {

    // CRUD DE CATEGORY

    // CREATE

    CategoryResponse createCategory(Category category);

    // READ

    List<CategoryResponse> listCategories();

    // UPDATE

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    // DELETE LOGIC

   void desactivateCategory(Long id);




}
