package com.mx.catalogservice;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Smoke test deshabilitado en pruebas unitarias puras (requiere PostgreSQL levantado)")
@SpringBootTest
class CatalogServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
