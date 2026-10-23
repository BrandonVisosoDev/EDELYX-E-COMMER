package com.mx.catalogservice.repository;

import com.mx.catalogservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryDao extends JpaRepository<Category, Long> {




}
