package com.mx.catalogservice.service;

import com.mx.catalogservice.model.CategoryRequest;
import com.mx.catalogservice.model.CategoryResponse;

import java.util.List;

public interface MetodosCategory {

    // CRUD DE CATEGORY

    // CREATE
    CategoryResponse createCategory(CategoryRequest request);

    // READ
    List<CategoryResponse> listActiveCategories();

    // UPDATE
    CategoryResponse updateCategory(Long id, CategoryRequest request);

    // DELETE LOGIC
    void deactivateCategory(Long id);

}
